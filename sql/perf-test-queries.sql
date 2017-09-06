-- Please run the below queries and note the query execution times.

--- Determine the column names for your custom workorder fields "Source IP Address and Port" and "Destination IP address and Port"
SELECT
  columnname,
  aliasname
FROM columnaliases
WHERE tablename = 'WorkOrder_Fields';


UDF_CHAR1  -> Source IP
UDF_CHAR4  -> Dest IP


-- The 'columnname' returned is what you will need to use in subsequent queries. The name will likely start with
-- "udf_char" and have a number after it.  For example, the column names might be "udf_char1" and "udf_char2"


-- Search for work order ids that have a custom work order_field that matches the given values
-- In this example we are searching for all work orders that have a source or destination IP address of
-- '34.213.37.88'

-- Note the following queries will not be able to make use of any indexes while searching your custom work order fields
-- because no indexes exist.  As a result, the query will have to do a full table scan to find work orders that match
-- the given IP address.  We are trying to determine the performance impact of this table scan.

-------------
-- QUERY 1
-------------
SELECT
  orders.workorderid,
  udf_char2,
  udf_char1
FROM public.workorder_fields
  AS fields LEFT JOIN public.workorder
  AS orders ON fields.workorderid = orders.workorderid
WHERE udf_char2 LIKE '34.213.37.88%'
      OR udf_char1 LIKE '34.213.37.88%';


"No Results" ->  514 ms

30 Results -> 686 ms

712 Results -> 384 ms



-------------
-- QUERY 2
-------------

-- The following tests looking up a larger number of IP addresses at a single time.  In theory the performance of
-- this query should closely match the performance of the `Query 1` because in both cases a full table scan is being
-- done regardless.

SELECT
  orders.workorderid,
  udf_char2,
  udf_char1
FROM public.workorder_fields
  AS fields LEFT JOIN public.workorder
  AS orders ON fields.workorderid = orders.workorderid
WHERE udf_char2    LIKE '34.213.37.88%'
      OR udf_char2 LIKE '35.213.37.88%'
      OR udf_char2 LIKE '36.213.37.88%'
      OR udf_char2 LIKE '37.213.37.88%'
      OR udf_char2 LIKE '38.213.37.88%'
      OR udf_char2 LIKE '39.213.37.88%'
      OR udf_char2 LIKE '40.213.37.88%'
      OR udf_char2 LIKE '41.213.37.88%'
      OR udf_char2 LIKE '42.213.37.88%'
      OR udf_char2 LIKE '43.213.37.88%'
      OR udf_char2 LIKE '44.213.37.88%'
      OR udf_char2 LIKE '45.213.37.88%'
      OR udf_char2 LIKE '46.213.37.88%'
      OR udf_char1 LIKE '34.213.37.88%'
      OR udf_char1 LIKE '35.213.37.88%'
      OR udf_char1 LIKE '36.213.37.88%'
      OR udf_char1 LIKE '37.213.37.88%'
      OR udf_char1 LIKE '38.213.37.88%'
      OR udf_char1 LIKE '39.213.37.88%'
      OR udf_char1 LIKE '40.213.37.88%'
      OR udf_char1 LIKE '41.213.37.88%'
      OR udf_char1 LIKE '42.213.37.88%'
      OR udf_char1 LIKE '43.213.37.88%'
      OR udf_char1 LIKE '44.213.37.88%'
      OR udf_char1 LIKE '45.213.37.88%'
      OR udf_char1 LIKE '46.213.37.88%';


"No Results" -> 3 seconds
"187 results" -> 3 seconds


-- We will now create an index on the table for the two custom columns that map to our source and destination
-- IP addresses.  These indexes should speed up the above queries as they will allow postgres to skip the
-- full table scan.  In our testing the workorder_fields had to be casted to type `TEXT` when creating the index.
-- By default these columns are of type `citext` and the index was not being used.
-- Index Creation
CREATE INDEX dest_ip_idx
  ON public.workorder_fields (CAST(udf_char1 AS TEXT) text_pattern_ops);
CREATE INDEX src_ip_idx
  ON public.workorder_fields (CAST(udf_char2 AS TEXT) text_pattern_ops);

-------------
-- QUERY 3
-------------

-- This is the same query as above with the exception that we have to cast the `citext` columns to plain `text`.
-- Please run an explain on this query to see if the above indexes (dest_ip_idx and src_ip_idx) are being used.
SELECT
  orders.workorderid,
  udf_char2,
  udf_char1,
CASE WHEN udf_char2 LIKE '34.213.37.88%' THEN '34.213.37.88'
WHEN udf_char2 LIKE '65.123.23.132%' THEN '65.123.23.132'
END as udf_char2_match,
CASE WHEN udf_char1 LIKE '34.213.37.88%' THEN '34.213.37.88'
WHEN udf_char1 LIKE '65.123.23.132%' THEN '65.123.23.132'
END as udf_char1_match
FROM public.workorder_fields
  AS fields LEFT JOIN public.workorder
  AS orders ON fields.workorderid = orders.workorderid
WHERE udf_char2 :: TEXT LIKE '34.213.37.88%'
  OR udf_char1 :: TEXT LIKE '34.213.37.88%'
  OR udf_char2 :: TEXT LIKE '65.123.23.132%'
      OR udf_char1 :: TEXT LIKE '65.123.23.132%';


With indexes no results => 60 ms
With indexes 187 results => 60 ms


-- If the created indexes are not being used then for testing purposes you can disable sequential scans
-- for just your session with the following command:

set enable_seqscan = off;

-------------
-- QUERY 4
-------------

-- This is the multi IP lookup query but includes the casts to `text` to ensure the index we created is being
-- used.

SELECT
  orders.workorderid,
  udf_char2,
  udf_char1
FROM public.workorder_fields
  AS fields LEFT JOIN public.workorder
  AS orders ON fields.workorderid = orders.workorderid
WHERE udf_char2 :: TEXT LIKE '34.213.37.88%'
      OR udf_char2 :: TEXT LIKE '35.213.37.88%'
      OR udf_char2 :: TEXT LIKE '36.213.37.88%'
      OR udf_char2 :: TEXT LIKE '37.213.37.88%'
      OR udf_char2 :: TEXT LIKE '38.213.37.88%'
      OR udf_char2 :: TEXT LIKE '39.213.37.88%'
      OR udf_char2 :: TEXT LIKE '40.213.37.88%'
      OR udf_char2 :: TEXT LIKE '41.213.37.88%'
      OR udf_char2 :: TEXT LIKE '42.213.37.88%'
      OR udf_char2 :: TEXT LIKE '43.213.37.88%'
      OR udf_char2 :: TEXT LIKE '44.213.37.88%'
      OR udf_char2 :: TEXT LIKE '45.213.37.88%'
      OR udf_char2 :: TEXT LIKE '46.213.37.88%'
      OR udf_char1 :: TEXT LIKE '34.213.37.88%'
      OR udf_char1 :: TEXT LIKE '35.213.37.88%'
      OR udf_char1 :: TEXT LIKE '36.213.37.88%'
      OR udf_char1 :: TEXT LIKE '37.213.37.88%'
      OR udf_char1 :: TEXT LIKE '38.213.37.88%'
      OR udf_char1 :: TEXT LIKE '39.213.37.88%'
      OR udf_char1 :: TEXT LIKE '40.213.37.88%'
      OR udf_char1 :: TEXT LIKE '41.213.37.88%'
      OR udf_char1 :: TEXT LIKE '42.213.37.88%'
      OR udf_char1 :: TEXT LIKE '43.213.37.88%'
      OR udf_char1 :: TEXT LIKE '44.213.37.88%'
      OR udf_char1 :: TEXT LIKE '45.213.37.88%'
      OR udf_char1 :: TEXT LIKE '46.213.37.88%';

-- Please try running the above queries with and without indexes using multiple IP addresses and record the how long
-- each query takes to run.



SELECT orders.workorderid,
  UDF_CHAR2 as "Source IP Address and Port",
  UDF_CHAR1 as "Destination IP Address and Port",
  CASE  WHEN UDF_CHAR2 LIKE 34.213.37.88% THEN 34.213.37.88 END AS "UDF_CHAR2_term", CASE  WHEN UDF_CHAR1 LIKE 34.213.37.88% THEN 34.213.37.88 END AS "UDF_CHAR1_term" FROM public.workorder_fields                         AS fields LEFT JOIN public.workorder                         AS orders ON fields.workorderid = orders.workorderid WHERE UDF_CHAR2 :: TEXT LIKE $1 OR UDF_CHAR1 :: TEXT LIKE $2
