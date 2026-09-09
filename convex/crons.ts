import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("expire login failure records", { minutes: 10 }, internal.users.cleanLoginFailures, {});
export default crons;
