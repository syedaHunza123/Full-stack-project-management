import { Pool } from 'pg';

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_I19dJuReDoby@ep-misty-shape-a5itp2c1.us-east-2.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;