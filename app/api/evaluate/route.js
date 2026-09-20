import { experimental_evaluate as evaluate } from "ai";
import { challenges as NASA_CHALLENGES } from "../../../data/challenges";

export async function POST(request) {
  try {
    const {
      challenge,
      idea,
      language = "es",
      criteria = [],
      mode = "evaluate",
      challengeOptions = [],
    } = await request.json();
    if (!idea?.trim())
      return Response.json({ error: "idea is required" }, { status: 400 });
    if (mode === "match") {
      const options = (
        challengeOptions.length
          ? challengeOptions
          : NASA_CHALLENGES.map((item) => item.title)
      )
        .filter(Boolean)
        .slice(0, 20);
      if (options.length < 2)
        return Response.json(
          { error: "at least two challenge options are required" },
          { status: 400 },
        );
      const result = await evaluate({
        model: "typesafe-ai/jev",
        state: `User project idea: ${idea.trim()}`,
        questions: {
          challenge: {
            type: "choice",
            instructions:
              "Which NASA Space Apps challenge best matches the project's central technical goal? Choose the challenge whose specific criteria match the core deliverable, not one that only shares a broad topic.",
            criteria: Object.fromEntries(
              options.map((option) => {
                const challenge = NASA_CHALLENGES.find(
                  (item) => item.title === option,
                );
                const description = challenge?.criteria
                  .map(({ label, instructions }) => `${label}: ${instructions}`)
                  .join(" ");
                return [option, description || option];
              }),
            ),
          },
        },
      });
      const match = result.answers?.challenge?.choice;
      if (!match)
        return Response.json(
          { error: "Jev did not return a matching challenge" },
          { status: 502 },
        );
      return Response.json({ match });
    }
    if (!challenge)
      return Response.json(
        { error: "challenge is required for evaluation mode" },
        { status: 400 },
      );
    const challengeCriteria =
      NASA_CHALLENGES.find((item) => item.title === challenge)?.criteria || [];
    const selectedCriteria = (criteria.length ? criteria : challengeCriteria)
      .filter(
        (item) =>
          item?.key &&
          item?.label &&
          item?.instructions &&
          (item.type !== "choice" || item.options?.length > 1),
      )
      .slice(0, 8);
    if (!selectedCriteria.length)
      return Response.json(
        { error: "at least one evaluation criterion is required" },
        { status: 400 },
      );

    const result = await evaluate({
      model: "typesafe-ai/jev",
      state: [
        "You are evaluating an idea for NASA Space Apps.",
        `Selected challenge (do not translate or replace it): ${challenge}`,
        `User project idea: ${idea.trim()}`,
        `Return probabilities for the idea against the selected challenge, not against NASA in general.`,
        `The UI language is ${language === "es" ? "Spanish" : "English"}. Interpret Spanish input correctly; language only affects presentation, not the challenge or idea.`,
      ].join("\n"),
      questions: Object.fromEntries(
        selectedCriteria.map(
          ({ key, type = "boolean", instructions, options }) => [
            key,
            {
              type,
              instructions: `For the selected challenge "${challenge}": ${instructions}`,
              ...(type === "choice"
                ? {
                    criteria: Object.fromEntries(
                      options.map((option) => [option, option]),
                    ),
                  }
                : {}),
            },
          ],
        ),
      ),
    });

    const matches = Object.entries(result.answers).map(([key, answer]) => ({
      key,
      ...selectedCriteria.find((item) => item.key === key),
      type: answer.type,
      probability: answer.probability,
      choice: answer.choice,
    }));

    return Response.json({ matches });
  } catch (error) {
    console.error("Jev evaluation failed", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Jev evaluation failed",
      },
      { status: 502 },
    );
  }
}
