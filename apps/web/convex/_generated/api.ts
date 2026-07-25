// Re-export API from the database package's generated files directly
// We can't use @oryn/database because it also exports React hooks
export { api, internal } from "../../../../packages/database/convex/_generated/api";
