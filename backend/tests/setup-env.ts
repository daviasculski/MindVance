import os from "os";
import path from "path";

process.env.JWT_SECRET = "mindvance-test-secret";
process.env.UPLOAD_DIR = path.join(
  os.tmpdir(),
  `mindvance-jest-uploads-${process.pid}`,
);
