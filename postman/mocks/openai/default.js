const http = require("node:http");
let scenario = "normal";
http
  .createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = req.body || JSON.parse(raw || "{}");
    res.setHeader("Content-Type", "application/json");
    const send = (code, value) => {
      res.statusCode = code;
      res.end(JSON.stringify(value));
    };
    if (req.url === "/test/control") {
      scenario = body.scenario || "normal";
      return send(200, { scenario });
    }
    if (req.url !== "/responses")
      return send(501, { error: "ENDPOINT_NOT_MODELED" });
    if (
      body.reasoning?.effort !== "none" ||
      !body.model ||
      body.store !== false ||
      body.text?.format?.strict !== true
    )
      return send(400, { error: "Invalid request contract" });
    if (scenario === "failure")
      return send(429, { error: { message: "rate limited" } });
    if (scenario === "refusal")
      return send(200, {
        status: "completed",
        output: [
          { content: [{ type: "refusal", refusal: "Cannot classify" }] },
        ],
      });
    const answer =
      scenario === "invalid"
        ? { category: "Income", confidence: "HIGH" }
        : { category: "Shopping", confidence: "MEDIUM" };
    send(200, {
      status: "completed",
      output: [
        { content: [{ type: "output_text", text: JSON.stringify(answer) }] },
      ],
    });
  })
  .listen(process.env.PORT || 4012);
