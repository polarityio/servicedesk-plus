const {Pool, Client} = require('pg');

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

    connect(dbConfig){
        if (this._validateConfig()) {
            this.pool = new Pool({
                user: dbConfig.user,
                host: dbConfig.host,
                database: dbConfig.database,
                password: dbConfig.password,
                port: dbConfig.port
            });
        }
    }

    _validateConfig() {
        return true;
    }

    setSearchFields(searchFields){
        let self = this;

        if(!this.pool){
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
            sql = sql.slice(0,-3) + ")";

            console.info(sql);
            console.info(values);

            return client.query(sql, values).then(result => {
                if(searchFields.length !== result.rows.length){
                    return new Error('The provided workorder fields could not be found');
                }else{

                    result.rows.forEach(row => {
                        self._workorderColumnNames.push(row.columnname);
                        self._workorderColumnNamesAliased.push(row.columnname + ' as "' + row.aliasname + '"');
                    });
                    return;
                }
                client.release();
            }).catch(err =>{
                console.info("There was an error");
                console.info(err);
                client.release();
                return new Error(err);
            });
        });
    }

    _createCaseStatement(workorderColumn, searchField, entities){
        let sql = 'CASE ';
        entities.forEach(entity => {
           sql += ' WHEN ' + workorderColumn + ' LIKE \'' + entity.value + '%\' THEN \'' + entity.value + '\'';
        });
        sql += ' END AS "' + searchField + ' Match"';

        return sql;
    }

    lookupEntities(indicators) {
        let self = this;

        if(!this.pool){
            throw Error("You must call the connect method after constructing the servicedesk object");
            process.exit(1);
        }

        if(this._workorderColumnNames.length === 0){
            return Promise.reject(new Error("You must specify workorder columns"));
        }

        let searchColumns = this._workorderColumnNamesAliased.join(", ");

        return this.pool.connect().then(client => {
            let sql = "SELECT orders.workorderid, " + searchColumns + ", ";

            this._workorderColumnNames.forEach((workorderColumn, index) => {
                let caseStmt = self._createCaseStatement(workorderColumn,
                    self._workorderSearchFields[index], indicators);

                sql += caseStmt + ', ';
            });

            // Remove trailing comma
            sql = sql.slice(0, -2);

            sql +=   " FROM public.workorder_fields \
                        AS fields LEFT JOIN public.workorder \
                        AS orders ON fields.workorderid = orders.workorderid WHERE ";

            let values = [];

            indicators.forEach((indicator, index) => {
                self._workorderColumnNames.forEach(searchColumn => {
                    sql += searchColumn + " :: TEXT LIKE $" + (values.length + 1) + " OR ";
                    values.push(indicator.value + '%');
                });
            });

            // Remove trailig OR
            sql = sql.slice(0,-3);

            console.info('-------------------');
            console.info(sql);
            console.info('-------------------');

            return client.query(sql, values).then(result => {
                client.release();
                return result.rows;
            }).catch(err => {
                client.release();
                return Promise.reject(new Error(err));
                console.info("ERROR:");
                console.info(err.stack);
            });
        }).catch(err => {
            console.info("ERror getting client");
            console.error(err);
            return new Error(err);

        })
    }
}


module.exports = ServiceDesk;