module.exports = {
    /**
     * Name of the integration which is displayed in the Polarity integrations user interface
     *
     * @type String
     * @required
     */
    name: "ServiceDesk Plus",
    /**
     * The acronym that appears in the notification window when information from this integration
     * is displayed.  Note that the acronym is included as part of each "tag" in the summary information
     * for the integration.  As a result, it is best to keep it to 4 or less characters.  The casing used
     * here will be carried forward into the notification window.
     *
     * @type String
     * @required
     */
    acronym: "SD",
    /**
     * Description for this integration which is displayed in the Polarity integrations user interface
     *
     * @type String
     * @optional
     */
    description: "Discover Tickets with IPv4 Addresses within Custom Fields",
    entityTypes: ['IPv4'],
    /**
     * An array of style files (css or less) that will be included for your integration. Any styles specified in
     * the below files can be used in your custom template.
     *
     * @type Array
     * @optional
     */
    "styles": [
        "./styles/servicedesk.less"
    ],
    /**
     * Provide custom component logic and template for rendering the integration details block.  If you do not
     * provide a custom template and/or component then the integration will display data as a table of key value
     * pairs.
     *
     * @type Object
     * @optional
     */
    block: {
        component: {
            file: "./components/servicedesk-block.js"
        },
        template: {
            file: "./templates/servicedesk-block.hbs"
        }
    },
    summary: {
        component: {
            file: './components/servicedesk-summary.js'
        },
        template: {
            file: './templates/servicedesk-summary.hbs'
        }
    },
    db: {
        user: 'postgres',
        host: 'localhost',
        database: 'servicedesk',
        password: '',
        port: '65432'
    },
    serviceDesk:{
        /**
         * List of custom work order fields you would like to search.  These fields must match exactly how your
         * custom fields are called (Note: these fields ARE case sensitive).
         */
        workorderFields: ['Source IP Address and Port','Destination IP address and Port']
    },
    logging: {
        level: 'trace',  //trace, debug, info, warn, error, fatal
    },
    /**
     * Options that are displayed to the user/admin in the Polarity integration user-interface.  Should be structured
     * as an array of option objects.
     *
     * @type Array
     * @optional
     */
    "options": []
};