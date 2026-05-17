import { migrate } from "../src/lib/db";

migrate()
  .then(() => {
    console.log("Database is ready");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
