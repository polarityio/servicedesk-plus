# Polarity ManageEngine ServiceDesk Plus MSP Integration

![image](https://img.shields.io/badge/status-beta-yellow.svg)

## Overview

The ServiceDesk Plus MSP integration currently searches custom workorder fields to identify tickets related to IP addresses on your screen.  As an example, if you create a custom workorder field called "Source IP Address", this integration would be able to display tickets where the "Source IP Address" workorder field matches an IP address on your screen.


| ![image](https://user-images.githubusercontent.com/306319/30572253-78ec783c-9cba-11e7-80b5-6a9f3fd8ca8f.png) |
|---|
|*ServiceDesk Plus MSP Example* |

## Requirements

For this integration to work you must be running ManageEngine ServiceDesk Plus MSP and be using PostgreSQL as your backend database.

This integration requires direct access to the PostgreSQL database backing your ServiceDesk Plus MSP deployment.  Direct access to the database is required because the ServiceDesk Plus REST API does not allow tickets to be searched.  We recommend creating a read only PostgreSQL user to be used by this integration.

> The integration currently only works against the MSP version of ServiceDesk Plus.  If you are interested in having the integration work with the non-MSP version of ServiceDesk please [file an issue on GitHub](https://github.com/polarityio/servicedesk-plus/issues). 

## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).


## Creating PostgreSQL Indexes

Note that by default the ServiceDesk database does not have indexes on custom workorder fields.  We highly recommend creating indexes on these columns before running this integration.  Indexes on the appropriate columns will result in a significant improvement in performance.  

In our testing lookup query speed was increased nearly 10x after indexes were created.  To create indexes on each of your custom workorder fields please follow these steps:

The human readable version of the workorder field has an alias which is used within the database.  For example, the custom field might be "Source IP" but the alias used within the database would be `udf_char1`.  You need to determine the column alias for each custom workorder field you wish to search.  You can list all the aliases using the following SQL:

```postgresql
SELECT
  columnname,
  aliasname
FROM columnaliases
WHERE tablename = 'WorkOrder_Fields';
```

The output of this SQL will be a list of all your custom workorder fields and their `aliasname`.  The alias names generally take the form `udf_charX` where `X` is an integer.  Once you have the alias names for each column you will need to create an index for each one. You can create an index using the following SQL making sure to replace `<index_name>` and `<column_name_alias>` with the appropriate value. 

```postgresql
CREATE INDEX <index_name>
  ON public.workorder_fields (CAST(<column_name_alias> AS TEXT) text_pattern_ops);
```

As an example, if the `<column_name_alias>` is `udf_char1` and and the workorder field is "Source IP" you could use the following SQL:

```postgresql
CREATE INDEX src_ip_idx
  ON public.workorder_fields (CAST(udf_char1 AS TEXT) text_pattern_ops);
```

> Note that you will need to create the indexes using a PostgreSQL user with write access to the ServiceDesk database.

## Configuration

After installing the integration you will need to open the `config/config.js` file and configure the connection to your ServiceDesk database.

You should see a property called `serviceDesk` which contains a `db` property and a `workorderFields` property.  Please see information below on how to set these properties.

### db

An object containing database configuration information so that the integration can connect to your ServiceDesk database.

#### host

The hostname of the database running ServiceDesk Plus

#### database

The name of the database you are connecting to.  For typical ServiceDesk installations this value should be set to "servicedesk".

#### user

The user you want the integration to connect to your postgres database as.  We recommend creating a read-only user for this purpose.

#### password

The database password for the provided user above.

#### port

The port your database is running on.  For typical ServiceDesk installations this value should be set to 65432.

```
// samples config for database
db: {    
    host: 'localhost',
    database: 'servicedesk',
    user: 'postgres',
    password: 'mypassword',
    port: '65432'        
}
```

### workorderFields

An array of workorder objects.  Each workorder object contains the following three properties:

#### name

The name of the custom workorder field you want to search.  Note that this field is case sensitive and much match exactly the name of your custom field.

#### shortName

Used in the notification overlay summary to indicate which custom fields an entity hit on. 

#### displayName

The display name for the custom field used in the details block of the integration.  Note that this value is used in the table within the details block of the workorder within the notification overlay.
 
```
// samples values for workorderFields
workorderFields: [
    {
        name: 'Source IP Address',
        shortName: 'src',
        displayName: 'Source IP'
    },
    {
        name: 'Destination IP Address',
        shortName: 'dst',
        displayName: 'Destination IP'
    }
]
```

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see: 

https://polarity.io/
