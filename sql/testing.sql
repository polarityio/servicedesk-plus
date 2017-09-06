-- Disable sequential scans to make testing index usage easier
set enable_seqscan = off;

-- Discover custom fields
SELECT * FROM columnaliases WHERE tablename = 'WorkOrder_Fields';

-- Index Creation
CREATE INDEX dest_ip_idx
  ON public.workorder_fields (CAST(udf_char1 AS TEXT) text_pattern_ops);
CREATE INDEX src_ip_idx
  ON public.workorder_fields (CAST(udf_char2 AS TEXT) text_pattern_ops);

-- Search for workorder ids that have a custom workorder_field that matches the given values
SELECT
  a.workorderid,
  udf_char2,
  udf_char1
FROM public.workorder_fields
  AS a LEFT JOIN public.workorder
  AS b ON a.workorderid = b.workorderid
WHERE udf_char2 :: TEXT LIKE '34.213.37.88%'
      OR udf_char1 :: TEXT LIKE '34.213.37.88%';