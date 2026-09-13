# Database Optimization Guide
This technical guide details performance tuning for PostgreSQL databases in enterprise applications.
Key recommendations:
1. Always create B-Tree indexes on foreign keys (such as uploaded_by, department_id, and category_id) to optimize JOIN performance.
2. Utilize composite indexes for multi-column uniqueness constraints.
3. Configure work_mem and shared_buffers appropriately to minimize disk spills during complex CTE aggregations and window functions.
Authored by Diana Prince, Engineering Department.