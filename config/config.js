module.exports = {
  /**
   * Name of the integration which is displayed in the Polarity integrations user interface
   *
   * @type String
   * @required
   */
  name: 'ServiceDesk Plus MSP',
  /**
   * The acronym that appears in the notification window when information from this integration
   * is displayed.  Note that the acronym is included as part of each "tag" in the summary information
   * for the integration.  As a result, it is best to keep it to 4 or less characters.  The casing used
   * here will be carried forward into the notification window.
   *
   * @type String
   * @required
   */
  acronym: 'SD',
  /**
   * Description for this integration which is displayed in the Polarity integrations user interface
   *
   * @type String
   * @optional
   */
  description: 'Discover Tickets with IPv4 Addresses within Custom Fields',
  entityTypes: ['IPv4'],
  /**
   * An array of style files (css or less) that will be included for your integration. Any styles specified in
   * the below files can be used in your custom template.
   *
   * @type Array
   * @optional
   */
  styles: ['./styles/servicedesk.less'],
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
      file: './components/servicedesk-block.js'
    },
    template: {
      file: './templates/servicedesk-block.hbs'
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
  serviceDesk: {
    db: {
      user: 'postgres',
      host: 'localhost',
      database: 'servicedesk',
      password: '',
      port: '65432'
    },
    /**
     * An array of custom workorderField objects.  Each object must contain the following properties:
     *
     * name: This is the case sensitive name of the workorder field as set in your servicedesk plus deployment
     * shortName: This is the name used to represent the field in the summary tags of the notification window
     * displayName: This is how you want the field to be displayed in the notification window.
     */
    workorderFields: [
      {
        name: 'Source IP Address and Port',
        shortName: 'src',
        displayName: 'Source IP'
      },
      {
        name: 'Destination IP address and Port',
        shortName: 'dst',
        displayName: 'Destination IP'
      }
    ]
  },
  request: {
    cert: '',
    key: '',
    passphrase: '',
    ca: '',
    proxy: '',
    rejectUnauthorized: true
  },
  logging: {
    level: 'info' //trace, debug, info, warn, error, fatal
  },
  /**
   * Options that are displayed to the user/admin in the Polarity integration user-interface.  Should be structured
   * as an array of option objects.
   *
   * @type Array
   * @optional
   */
  options: [
    {
      key: 'url',
      name: 'Server URL',
      description: 'URL to your ServiceDesk Plus Server (include http/https and port is applicable)',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};