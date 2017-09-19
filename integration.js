'use strict';

let config = require('./config/config');
let Logger;
const ServiceDesk = require('./lib/servicedesk');
let serviceDesk;


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

        let resultMatchLookup = {};

        results.forEach(result => {
            let match;

            // Loop through each workorder column looking for the non-null one which
            // is our match value.
            for(let i=0; i<workorderFields.length; i++){
                if(result[workorderFields[i].name + ' Match'] !== null){
                    match = result[workorderFields[i].name + ' Match'];
                    break;
                }
            }

            if(!Array.isArray(resultMatchLookup[match])){
                resultMatchLookup[match] = [];
            }
            resultMatchLookup[match].push(result);
        });

        console.info(resultMatchLookup);

        entities.forEach(entity => {
            // There was a hit on this entity
            if(resultMatchLookup[entity.value]){

                resultMatchLookup[entity.value].forEach(match =>{
                    match.url = options.url;
                    match.workorderFields = [];

                    workorderFields.forEach(field => {
                        match.workorderFields.push({
                            name: field.name,
                            shortName: field.shortName,
                            displayName: field.displayName,
                            value: match[field.name]
                        });
                    });
                });

                lookupResults.push({
                    entity:entity,
                    data: {
                        summary: [],
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
        serviceDesk.connect(config.serviceDesk.db);

        let fieldsArray = config.serviceDesk.workorderFields.map(field =>{
            return field.name;
        });

        serviceDesk.setSearchFields(fieldsArray).then(() => {
            Logger.debug({fields: fieldsArray}, 'Set Search Fields');
            cb(null);
        }).catch(err => {
            Logger.error({err:err}, 'Error setting search fields');
            cb(err);
        }).catch(err =>{
            // The error callback above itself throws an error so we have to have a second catch here.
        });
    };
}

module.exports = {
    doLookup: doLookup,
    startup: startup
};