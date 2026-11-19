const http = require("node:http");
let scenario = "normal";
http
  .createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = req.body || JSON.parse(raw || "{}");
    res.setHeader("Content-Type", "application/json");
    const send = (code, data) => {
      res.statusCode = code;
      res.end(JSON.stringify(data));
    };
    if (req.url === "/test/control") {
      scenario = body.scenario || "normal";
      return send(200, { scenario });
    }
    if (scenario === "unauthorized") return send(401, { error: { code: 401 } });
    if (scenario === "rate-limit") return send(429, { error: { code: 429 } });
    if (req.url !== "/v1/systemone" && (
      !body.provider?.zdr ||
      body.provider?.data_collection !== "deny" ||
      body.provider?.allow_fallbacks !== false ||
      !body.provider?.only?.length
    ))
      return send(400, { error: "Privacy routing contract missing" });
    if (req.url === "/v1/systemone") {
      if (
        body.questions?.category?.type !== "choice" ||
        !body.questions.category.criteria.Other ||
        !body.state?.merchant
      )
        return send(400, { error: "Invalid decision request" });
      const choice =
        scenario === "invalid"
          ? "Income"
          : scenario === "abstain"
            ? "Other"
            : "Shopping";
      return send(200, {
        model: body.model,
        answers: {
          category: {
            type: "choice",
            choice,
            confidence: scenario === "low" ? 0.3 : 0.95,
            probabilities: { [choice]: 0.96 },
          },
        },
        usage: { input_tokens: 100, output_tokens: 10, cost: 0.0000042 },
      });
    }
    if (req.url === "/v1/chat/completions") {
      if (
        body.reasoning?.effort !== "none" ||
        body.response_format?.json_schema?.strict !== true
      )
        return send(400, { error: "Invalid chat request" });
      return send(200, {
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify({
                category: scenario === "invalid" ? "Income" : "Shopping",
                confidence: "MEDIUM",
              }),
            },
          },
        ],
      });
    }
    send(501, { error: "ENDPOINT_NOT_MODELED" });
  })
  .listen(process.env.PORT || 4013);
