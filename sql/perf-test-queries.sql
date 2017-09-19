--- Determine the column names for your custom workorder fields "Source IP Address and Port" and "Destination IP address and Port"
SELECT
  columnname,
  aliasname
FROM columnaliases
WHERE tablename = 'WorkOrder_Fields';


-- UDF_CHAR1  -> Source IP
-- UDF_CHAR2  -> Dest IP


-- The 'columnname' returned is what you will need to use in subsequent queries. The name will likely start with
-- "udf_char" and have a number after it.  For example, the column names might be "udf_char1" and "udf_char2"


-- Search for work order ids that have a custom work order_field that matches the given values
-- In this example we are searching for all work orders that have a source or destination IP address of
-- '192.168.1.10'

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
WHERE udf_char2 LIKE '192.168.1.10%'
      OR udf_char1 LIKE '192.168.1.10%';


-- "No Results" ->  514 ms
-- 30 Results -> 686 ms
-- 712 Results -> 384 ms



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
WHERE udf_char2    LIKE '192.168.1.10%'
      OR udf_char2 LIKE '192.168.1.11%'
      OR udf_char2 LIKE '192.168.1.12%'
      OR udf_char2 LIKE '192.168.1.13%'
      OR udf_char2 LIKE '192.168.1.14%'
      OR udf_char2 LIKE '192.168.1.15%'
      OR udf_char1 LIKE '192.168.1.10%'
      OR udf_char1 LIKE '192.168.1.11%'
      OR udf_char1 LIKE '192.168.1.12%'
      OR udf_char1 LIKE '192.168.1.13%'
      OR udf_char1 LIKE '192.168.1.14%'
      OR udf_char1 LIKE '192.168.1.15%';


-- "No Results" -> 3 seconds
-- "187 results" -> 3 seconds


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
  orders.title,
  users.first_name,
  closures.name,
  udf_char2,
  udf_char1,
  orgs.org_id,
  orgs.name,
  orders.createdtime,
  orders.resolvedtime,
CASE WHEN udf_char2 LIKE '192.168.1.10%' THEN '192.168.1.10'
WHEN udf_char2 LIKE '192.168.1.15%' THEN '192.168.1.15'
END as udf_char2_match,
CASE WHEN udf_char1 LIKE '192.168.1.10%' THEN '192.168.1.10'
WHEN udf_char1 LIKE '192.168.1.15%' THEN '192.168.1.15'
END as udf_char1_match
FROM public.workorder_fields AS fields
  LEFT JOIN public.workorder AS orders ON fields.workorderid = orders.workorderid
  LEFT JOIN public.aaauser AS users ON orders.requesterid = users.user_id
  LEFT JOIN public.workorderstates AS states ON orders.workorderid = states.workorderid
  LEFT JOIN public.requestclosurecode AS closures ON states.closurecodeid = closures.closurecodeid
  LEFT JOIN public.sdorganization AS orgs ON orgs.org_id = orders.siteid
WHERE udf_char2 :: TEXT LIKE '192.168.1.10%'
  OR udf_char1 :: TEXT LIKE '192.168.1.10%'
  OR udf_char2 :: TEXT LIKE '192.168.1.15%'
      OR udf_char1 :: TEXT LIKE '192.168.1.15%';


-- With indexes no results => 60 ms
-- With indexes 187 results => 60 ms


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
WHERE udf_char2::TEXT LIKE '192.168.1.10%'
      OR udf_char2::TEXT LIKE '192.168.1.11%'
      OR udf_char2::TEXT LIKE '192.168.1.12%'
      OR udf_char2::TEXT LIKE '192.168.1.13%'
      OR udf_char2::TEXT LIKE '192.168.1.14%'
      OR udf_char2::TEXT LIKE '192.168.1.15%'
      OR udf_char1::TEXT LIKE '192.168.1.10%'
      OR udf_char1::TEXT LIKE '192.168.1.11%'
      OR udf_char1::TEXT LIKE '192.168.1.12%'
      OR udf_char1::TEXT LIKE '192.168.1.13%'
      OR udf_char1::TEXT LIKE '192.168.1.14%'
      OR udf_char1::TEXT LIKE '192.168.1.15%';