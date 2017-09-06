'use strict';

let config = require('./config/config');
let Logger;
const ServiceDesk = require('./lib/servicedesk');
let serviceDesk;

const IGNORED_IPS = new Set([
    '127.0.0.1',
    '255.255.255.255',
    '0.0.0.0'
]);

/**
 *
 * @param entities
 * @param options
 * @param cb
 */
function doLookup(entities, options, cb) {
    let workorderFields = config.serviceDesk.workorderFields;
    let lookupResults = [];

    serviceDesk.lookupEntities(entities).then(results => {

        console.info(results);

        let resultMatchLookup = [];

        results.forEach(result => {
            let match;

            // Loop through each workorder column looking for the non-null one which
            // is our match value.
            for(let i=0; i<workorderFields.length; i++){
                if(result[workorderFields[i] + ' Match'] !== null){
                    match = result[workorderFields[i] + ' Match'];
                    break;
                }
            }

            resultMatchLookup[match] = result;
        });

        console.info(resultMatchLookup);

        entities.forEach(entity => {
            // There was a hit on this entity
            if(resultMatchLookup[entity.value]){
                lookupResults.push({
                    entity:entity,
                    data: {
                        summary: [resultMatchLookup[entity.value].workorderid],
                        details: resultMatchLookup[entity.value]
                    }
                })
            }else{
                lookupResults.push({
                    entity: entity,
                    data: null
                })
            }
        });

        Logger.trace({lookupResults:lookupResults}, 'Results');
        cb(null, lookupResults);
    }).catch(err => {
        cb(err);
    });
}

function startup(logger) {
    Logger = logger;

    return function (cb) {
        serviceDesk = new ServiceDesk(logger);
        serviceDesk.connect(config.db);
        serviceDesk.setSearchFields(config.serviceDesk.workorderFields).then(() => {
            cb(null);
        }).catch(err => {
            cb(err);
        })
    };
}

module.exports = {
    doLookup: doLookup,
    startup: startup
};