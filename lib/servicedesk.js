const {Pool} = require('pg');

class ServiceDesk {
    constructor(logger) {
        if (logger) {
            this.log = logger;
        } else {
            this.log = {
                info: console.info,
                debug: console.debug,
                trace: console.trace,
                warn: console.warn,
                error: console.error
            };
        }

        this._workorderColumnNames = [];
        this._workorderColumnNamesAliased = [];
        this._workorderSearchFields = [];
    }

    connect(dbConfig) {
        let errMsg = this._validateConfig(dbConfig);
        if (errMsg) {
            throw new Error(errMsg);
        }else{
            this.pool = new Pool({
                user: dbConfig.user,
                host: dbConfig.host,
                database: dbConfig.database,
                password: dbConfig.password,
                port: dbConfig.port
            });
        }
    }

    _validateConfig(config) {
        if(typeof config.user !== 'string'){
            return 'You must provide a `db.user` config property';
        }
        if(typeof config.host !== 'string'){
            return 'You must provide a `db.host` config property';
        }
        if(typeof config.database !== 'string'){
            return 'You must provide a `db.database` config property';
        }
        if(typeof config.password !== 'string'){
            return 'You must provide a `db.password` config property';
        }
        if(typeof config.port !== 'string'){
            return 'You must provide a `db.port` config property';
        }
    }

    setSearchFields(searchFields) {
        let self = this;

        if (!this.pool) {
            this.log.error('You must call the connect method after constructing the servicedesk object');
            return Promise.reject(new Error("You must call the connect method after constructing the servicedesk object"));
        }

        this._workorderSearchFields = searchFields;

        return this.pool.connect().then(client => {
            let sql = "SELECT columnname, aliasname \
                FROM columnaliases \
                WHERE tablename = 'WorkOrder_Fields' AND (";
            let values = [];

            searchFields.forEach(searchField => {
                sql += "aliasname = $" + (values.length + 1) + ' OR ';
                values.push(searchField);
            });

            // Remove the trailing ' OR '
            sql = sql.slice(0, -3) + ")";

            return client.query(sql, values).then(result => {
                if (searchFields.length !== result.rows.length) {
                    return Promise.reject('The provided workorder fields could not be found');
                } else {
                    result.rows.forEach(row => {
                        self._workorderColumnNames.push(row.columnname);
                        self._workorderColumnNamesAliased.push(row.columnname + ' as "' + row.aliasname + '"');
                    });
                    return;
                }
                client.release();
            }).catch(queryErr => {
                client.release();
                throw queryErr;
            });
        }).catch(poolError => {
            throw poolError;
        });
    }

    _createCaseStatement(workorderColumn, searchField, entities) {
        let self = this;
        let sql = "CASE ";
        entities.forEach(entity => {
            sql += " WHEN " + workorderColumn + " LIKE '" + self._searchString(entity.value) + "' THEN '" +
                entity.value + "'";
        });
        sql += ' END AS "' + searchField + ' Match"';

        return sql;
    }

    _searchString(entityValue) {
        return entityValue + ':%';
    }

    lookupEntities(indicators) {
        let self = this;

        if (!this.pool) {
            throw Error("You must call the connect method after constructing the servicedesk object");
            process.exit(1);
        }

        if (this._workorderColumnNames.length === 0) {
            return Promise.reject(new Error("You must specify workorder columns"));
        }

        let searchColumns = this._workorderColumnNamesAliased.join(", ");

        return this.pool.connect().then(client => {
            let sql = "SELECT orders.workorderid, orders.title, orders.description, orders.respondedtime, " +
                "users.first_name, users.middle_name, users.last_name, " +
                "orgs.org_id, orgs.name, orders.createdtime, orders.resolvedtime, " +
                searchColumns + ", ";

            this._workorderColumnNames.forEach((workorderColumn, index) => {
                let caseStmt = self._createCaseStatement(workorderColumn,
                    self._workorderSearchFields[index], indicators);

                sql += caseStmt + ', ';
            });

            // Remove trailing comma
            sql = sql.slice(0, -2);

            sql += " FROM public.workorder_fields AS fields \
                        LEFT JOIN public.workorder  AS orders \
                        ON fields.workorderid = orders.workorderid \
                        LEFT JOIN public.aaauser AS users \
                        ON orders.requesterid = users.user_id \
                        LEFT JOIN public.sdorganization AS orgs \
                        ON orgs.org_id = orders.siteid \
                        WHERE ";

            let values = [];

            indicators.forEach((indicator, index) => {
                self._workorderColumnNames.forEach(searchColumn => {
                    sql += searchColumn + " :: TEXT LIKE $" + (values.length + 1) + " OR ";
                    values.push(self._searchString(indicator.value));
                });
            });

            // Remove trailig OR
            sql = sql.slice(0, -3);
            sql += " ORDER BY orders.createdtime DESC";


            self.log.debug({sql:sql, values:values}, 'Lookup SQL');

            return client.query(sql, values).then(result => {
                client.release();
                return result.rows;
            }).catch(queryErr => {
                client.release();
                throw queryErr;
            });
        }).catch(poolErr => {
            throw poolErr;
        })
    }
}


module.exports = ServiceDesk;