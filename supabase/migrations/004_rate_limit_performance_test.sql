-- Performance Testing Script for Rate Limit Tracking Table
-- Run this after creating the table to verify performance

-- Test 1: Bulk insert performance (simulate high traffic)
DO $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  elapsed_ms int;
BEGIN
  start_time := clock_timestamp();
  
  -- Insert 10,000 rate limit records
  INSERT INTO rate_limit_tracking (identifier, action, window_start, count)
  SELECT 
    'user:' || gen_random_uuid()::text,
    '/api/signals',
    date_trunc('minute', NOW() - (random() * INTERVAL '60 minutes')),
    floor(random() * 100 + 1)::int
  FROM generate_series(1, 10000);
  
  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RAISE NOTICE 'Bulk insert of 10,000 records: % ms', elapsed_ms;
  
  -- Clean up test data
  DELETE FROM rate_limit_tracking WHERE identifier LIKE 'user:%';
END $$;

-- Test 2: Upsert performance (typical operation)
DO $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  elapsed_ms int;
  test_identifier text := 'test:performance';
  test_window timestamp := date_trunc('minute', NOW());
BEGIN
  start_time := clock_timestamp();
  
  -- Perform 1000 upserts on the same key
  FOR i IN 1..1000 LOOP
    INSERT INTO rate_limit_tracking (identifier, action, window_start, count)
    VALUES (test_identifier, '/api/test', test_window, 1)
    ON CONFLICT (identifier, action, window_start)
    DO UPDATE SET 
      count = rate_limit_tracking.count + 1,
      last_request_at = NOW();
  END LOOP;
  
  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RAISE NOTICE 'Upsert 1000 operations: % ms (avg % ms per op)', elapsed_ms, elapsed_ms::float / 1000;
  
  -- Clean up
  DELETE FROM rate_limit_tracking WHERE identifier = test_identifier;
END $$;

-- Test 3: Query performance (checking rate limits)
DO $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  elapsed_ms int;
  result_count int;
BEGIN
  -- Insert test data
  INSERT INTO rate_limit_tracking (identifier, action, window_start, count)
  SELECT 
    'ip:192.168.' || (i % 256) || '.' || floor(i / 256)::int,
    CASE WHEN i % 3 = 0 THEN '/api/signals'
         WHEN i % 3 = 1 THEN '/api/analysis'
         ELSE '/auth/signin' END,
    date_trunc('minute', NOW() - ((i % 60) * INTERVAL '1 minute')),
    floor(random() * 50 + 1)::int
  FROM generate_series(1, 50000) i;
  
  start_time := clock_timestamp();
  
  -- Typical rate limit check query
  SELECT SUM(count) INTO result_count
  FROM rate_limit_tracking
  WHERE identifier = 'ip:192.168.1.1'
    AND action = '/api/signals'
    AND window_start = date_trunc('minute', NOW());
  
  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RAISE NOTICE 'Single rate limit check: % ms', elapsed_ms;
  
  -- Window query performance
  start_time := clock_timestamp();
  
  SELECT COUNT(*) INTO result_count
  FROM rate_limit_tracking
  WHERE window_start > NOW() - INTERVAL '5 minutes';
  
  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RAISE NOTICE 'Window query (5 min): % ms, found % records', elapsed_ms, result_count;
  
  -- Clean up
  DELETE FROM rate_limit_tracking WHERE identifier LIKE 'ip:%';
END $$;

-- Test 4: Cleanup performance
DO $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  elapsed_ms int;
  deleted_count int;
BEGIN
  -- Insert old test data
  INSERT INTO rate_limit_tracking (identifier, action, window_start, count)
  SELECT 
    'cleanup:' || i::text,
    '/api/test',
    NOW() - INTERVAL '25 hours' - (i * INTERVAL '1 minute'),
    1
  FROM generate_series(1, 10000) i;
  
  start_time := clock_timestamp();
  
  -- Run cleanup
  DELETE FROM rate_limit_tracking
  WHERE window_start < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RAISE NOTICE 'Cleanup of % old records: % ms', deleted_count, elapsed_ms;
END $$;

-- Test 5: Index effectiveness
EXPLAIN (ANALYZE, BUFFERS)
SELECT count, last_request_at
FROM rate_limit_tracking
WHERE identifier = 'user:test-user-id'
  AND action = '/api/signals'
  AND window_start = date_trunc('minute', NOW());

-- Test 6: Concurrent access simulation
-- This tests the optimized function
DO $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  elapsed_ms int;
  current_count int;
BEGIN
  start_time := clock_timestamp();
  
  -- Simulate 100 concurrent requests
  FOR i IN 1..100 LOOP
    SELECT * INTO current_count 
    FROM increment_rate_limit(
      'concurrent:test',
      '/api/heavy',
      date_trunc('minute', NOW()),
      jsonb_build_object('request_id', i)
    );
  END LOOP;
  
  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RAISE NOTICE 'Concurrent access test (100 requests): % ms, final count: %', elapsed_ms, current_count;
  
  -- Clean up
  DELETE FROM rate_limit_tracking WHERE identifier = 'concurrent:test';
END $$;

-- Summary statistics
SELECT 
  'Table Size' as metric,
  pg_size_pretty(pg_total_relation_size('rate_limit_tracking')) as value
UNION ALL
SELECT 
  'Index Size',
  pg_size_pretty(sum(pg_total_relation_size(indexrelid)))
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename = 'rate_limit_tracking'
UNION ALL
SELECT 
  'Total Rows',
  count(*)::text
FROM rate_limit_tracking;