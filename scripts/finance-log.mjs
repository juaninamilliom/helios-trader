export function sanitizeLog(line, secrets = []) {
  let text = line
    .replace(/\x1b\[[0-9;]*m/g, "")
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
  for (const secret of secrets) text = text.split(secret).join("[redacted]");
  text = text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email redacted]")
    .replace(
      /(?:access|public|link|refresh)-(?:sandbox|production)-[\w-]+/g,
      "[token redacted]",
    )
    .replace(/\b(?:sk-[\w-]+|GOCSPX-[\w-]+)/g, "[credential redacted]");
  // Only operational messages are retained. Unknown payloads are deliberately suppressed.
  if (text.startsWith("[helios-http] ")) {
    try {
      const e = JSON.parse(text.slice(14));
      if (
        !/^[A-Z]+$/.test(e.method) ||
        typeof e.route !== "string" ||
        !Number.isInteger(e.status) ||
        e.status < 100 ||
        e.status > 599 ||
        !/^\/[a-zA-Z0-9_:/.-]*$|^unmatched$/.test(e.route)
      )
        return "[http output suppressed]";
      return `[helios-http] ${JSON.stringify({ method: e.method, route: e.route, status: e.status, requestAuthenticated: !!e.requestAuthenticated, sessionHasUser: !!e.sessionHasUser })}`;
    } catch {
      return "[invalid http log suppressed]";
    }
  }
  const fixedMessages = [
    ["[finance-sync]", "Background sync failed; retrying on the next poll."],
    ["[NestFactory]", "Starting Nest application"],
    ["[NestApplication]", "Nest application successfully started"],
    [
      "[GoogleStrategy]",
      "Using Google Callback URL: http://localhost:3001/api/authentication/google/callback",
    ],
    ["[PrismaService]", "Connecting to database"],
    ["[PrismaService]", "Successfully connected to database"],
    ["[PrismaService]", "Disconnecting from database"],
    ["[AuthService]", "Creating a user account"],
    ["[AuthService]", "Existing user authenticated"],
  ];
  for (const [source, message] of fixedMessages) {
    if (text.includes(source) && text.includes(message))
      return `${source} ${message}`;
  }
  if (
    text.includes("[InstanceLoader]") &&
    text.includes("dependencies initialized")
  )
    return "[InstanceLoader] Module dependencies initialized";
  if (text.includes("[RouterExplorer]") && text.includes("Mapped {"))
    return "[RouterExplorer] API route registered";
  if (text.includes("[RoutesResolver]"))
    return "[RoutesResolver] Controller registered";
  if (
    /^prisma:info Starting a postgresql pool with \d+ connections\.$/.test(text)
  )
    return "prisma:info PostgreSQL connection pool started";
  const diagnostic = text.match(/error (TS\d+)/);
  if (diagnostic)
    return `[type-check error] ${diagnostic[1]} (source excerpt omitted)`;
  const error = text.match(
    /\b(TokenError|AuthorizationError|UnauthorizedException|ForbiddenException|PrismaClient\w*Error|TSError|TypeError|SyntaxError|EADDRINUSE|ECONNREFUSED|EACCES|EPERM)\b/,
  );
  if (error) return `[application error] ${error[1]} (payload omitted)`;
  return text.trim() ? "[application output suppressed]" : null;
}
