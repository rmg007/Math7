-- Helper function for drift detection to query table schema
CREATE OR REPLACE FUNCTION get_table_schema(p_table_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(json_build_object(
    'column_name', column_name,
    'data_type', data_type,
    'is_nullable', is_nullable,
    'column_default', column_default
  ))
  INTO result
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = p_table_name
  ORDER BY ordinal_position;
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_table_schema IS 'Oracle Plus: Returns schema information for drift detection';
