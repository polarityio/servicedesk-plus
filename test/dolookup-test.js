/*
 * Copyright (c) 2017. Breach Intelligence, Inc.
 * All rights reserved
 */

'use strict';

let chai = require('chai');
let expect = chai.expect;
let nock = require('nock');
let integration = require('../integration');

// Note this was just a stub test for initial smoke testing
describe('doLookup()', function () {
    before(function (done) {

        let callback = integration.startup({
            trace: function () {
            },
            info: function () {
            },
            debug: function (msg) {
                //console.info(msg)
            },
            error: function () {
            }
        });

        callback(done);
    });

    it('should do something', function(done){

        integration.doLookup([{
            type: 'ip',
            types: ['ipv4', 'ip'],
            value: '192.168.11.2',
            isIPv4: true
        },
            {
                type: 'ip',
                types: ['ipv4', 'ip'],
                value: '192.168.11.3',
                isIPv4: true
            }], {}, function(err, results){
            if(err){
                console.info(err);
            }else{
                console.info(JSON.stringify(results, null, 4));
            }
            done();
        })
    });
});