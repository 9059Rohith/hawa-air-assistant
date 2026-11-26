"use client";
import { useState } from "react";
import { communityImpact } from "@/domain/impact";
import { useHawa } from "./Provider";
import { planInputsMatch } from "@/lib/plan-context";
import { ReadAloud } from "./ReadAloud";
import { SharedKit } from "./SharedKit";
export function Community() {
  const { t, profile } = useHawa();
  const [kind, setKind] = useState("Neighbourhood");
  const hi = profile.lang === "hi";
  const [issues, setIssues] = useState<string[]>([]);
  const days = hi
    ? [
        "हवा का स्रोत तय करें",
        "कचरा न जलाने का संकल्प",
        "फ़िल्टर और साफ कमरे की जाँच",
        "साझा यात्रा की योजना",
        "संवेदनशील पड़ोसियों की मदद",
        "धूल की सुरक्षित रिपोर्ट",
        "सीख और अगले कदम साझा करें",
      ]
    : [
        "Agree a trusted local air-data source",
        "Commit to no waste burning",
        "Check filters and designate a clean-air room",
        "Coordinate safe shared transport",
        "Check on higher-risk neighbours with consent",
        "Report persistent dust through official channels",
        "Review what worked and plan the next week",
      ];
  const notice = hi
    ? `${kind}: इस सप्ताह साफ हवा के छोटे कदम अपनाएँ। कचरा न जलाएँ, इंजन बेवजह चालू न रखें, और स्थानीय हवा के अनुसार गतिविधि बदलें। संवेदनशील पड़ोसियों की मदद उनकी अनुमति से करें।`
    : `${kind}: join our clean-air week. Keep waste out of fires, avoid unnecessary idling, and adjust activities to local air conditions. Check on higher-risk neighbours with their consent.`;
  return (
    <>
      <SharedKit />
      <section className="hero compact">
        <h1>{t.community}</h1>
        <p>
          {hi
            ? "एक घर से पूरे मोहल्ले तक।"
            : "From one household to a whole neighbourhood."}
        </p>
      </section>
      <CommunityScenario
        hi={hi}
        kind={kind}
        setKind={setKind}
        issues={issues}
        setIssues={setIssues}
      />
      <section className="community-kit">
        <h2>{hi ? "स्थानीय कार्य सूची" : "Local action checklist"}</h2>
        {(issues.length ? issues : ["0"]).map((i) => (
          <label className="check" key={i}>
            <input type="checkbox" />
            {
              (hi
                ? [
                    "कचरा संग्रह का समय तय करें; जलाने की शिकायत आधिकारिक चैनल पर करें।",
                    "स्कूल और परिसर में इंजन बंद रखने के संकेत लगाएँ।",
                    "धूल के लिए निर्माण स्थल की घेराबंदी और गीली सफ़ाई माँगें।",
                    "जनरेटर रखरखाव और स्वच्छ बैकअप पर समिति से चर्चा करें।",
                    "स्वच्छ खाना पकाने के विकल्प और सहायता योजनाएँ साझा करें।",
                    "उद्योग के दिखाई देने वाले उत्सर्जन की आधिकारिक चैनल पर शिकायत करें।",
                  ]
                : [
                    "Agree waste collection times; report burning through official channels.",
                    "Add no-idling signs at school and society gates.",
                    "Request site barriers and wet dust-control practices.",
                    "Ask the committee about generator maintenance and cleaner backup.",
                    "Share cleaner cooking options and local support schemes.",
                    "Report visible industrial emissions through official channels.",
                  ])[Number(i)]
            }
          </label>
        ))}
        {kind === "School" && (
          <div className="panel">
            <h3>{hi ? "स्कूल किट" : "School clean-air kit"}</h3>
            {(hi
              ? [
                  "हर सुबह स्थानीय हवा की जाँच के लिए जिम्मेदार व्यक्ति तय करें।",
                  "प्रदूषण बढ़ने पर कठिन बाहरी खेल के बदले अंदर की गतिविधि रखें।",
                  "अभिभावकों को स्रोत और समय सहित सूचना दें; स्वास्थ्य विवरण साझा न करें।",
                ]
              : [
                  "Assign a person to check local air guidance each morning.",
                  "Prepare indoor alternatives to strenuous outdoor sport when pollution is high.",
                  "Send parents the source and timestamp; keep individual health information private.",
                ]
            ).map((s) => (
              <label className="check" key={s}>
                <input type="checkbox" />
                {s}
              </label>
            ))}
          </div>
        )}
        <h2>
          {hi
            ? "सात दिन की साफ हवा चुनौती"
            : "Your seven-day clean-air challenge"}
        </h2>
        <ol className="week-list">
          {days.map((day, i) => (
            <li key={day}>
              <strong>0{i + 1}</strong>
              <span>{day}</span>
              <input aria-label={`Complete day ${i + 1}`} type="checkbox" />
            </li>
          ))}
        </ol>
        <CommunityNotice hi={hi} notice={notice} />
        <h2>{hi ? "सुरक्षित शिकायत" : "Report safely"}</h2>
        <p>
          Record the time, location and visible issue without confrontation. Use
          your municipal authority or pollution-control board’s official
          complaint channel. Do not publish neighbours’ personal details. For
          urgent breathing symptoms, seek medical help.
        </p>
        <ReadAloud text={`${notice} ${days.join(". ")}`} />
      </section>
    </>
  );
}

type CommunityChoices = {
  hi: boolean;
  kind: string;
  setKind: (value: string) => void;
  issues: string[];
  setIssues: (values: string[]) => void;
};
function CommunityScenario({
  hi,
  kind,
  setKind,
  issues,
  setIssues,
}: CommunityChoices) {
  const { plan, profile, location, air } = useHawa();
  const currentPlan =
    plan && planInputsMatch(plan, profile, location, air) ? plan : null;
  const [count, setCount] = useState(100),
    [adoption, setAdoption] = useState(30);
  const sources = hi
    ? [
        "कचरा जलाना",
        "वाहन का धुआँ",
        "निर्माण की धूल",
        "डीज़ल जनरेटर",
        "ठोस ईंधन पर खाना",
        "उद्योग",
      ]
    : [
        "Waste burning",
        "Traffic exhaust",
        "Construction dust",
        "Diesel generators",
        "Biomass cooking",
        "Industry",
      ];
  const valid = Number.isInteger(count) && count >= 1 && count <= 10000;
  const kg = valid
    ? communityImpact(currentPlan?.impact.co2KgDay ?? 0, count, adoption)
    : 0;
  return (
    <section className="panel">
      <CommunityInputs
        hi={hi}
        kind={kind}
        setKind={setKind}
        count={count}
        setCount={setCount}
        adoption={adoption}
        setAdoption={setAdoption}
      />{" "}
      {!valid && <p role="status">Enter 1–10,000 households.</p>}
      <fieldset>
        <legend>
          {hi ? "स्थानीय प्रदूषण स्रोत" : "Local pollution sources"}
        </legend>
        {sources.map((s, i) => (
          <label className="check" key={i}>
            <input
              type="checkbox"
              checked={issues.includes(String(i))}
              onChange={(e) =>
                setIssues(
                  e.target.checked
                    ? [...issues, String(i)]
                    : issues.filter((x) => x !== String(i)),
                )
              }
            />
            {s}
          </label>
        ))}
      </fieldset>
      <h2>{hi ? "सामूहिक प्रभाव का उदाहरण" : "Collective impact scenario"}</h2>
      <p>{communitySummary(hi, !!currentPlan && valid, kg)}</p>
      <p className="fine">
        {hi
          ? "परिवार × भागीदारी × एक यात्री की दैनिक बचत × सात दिन। यह भविष्यवाणी या माप नहीं है। स्वास्थ्य प्रभाव को गुणा नहीं करते।"
          : "Households × participation × one commuter’s daily saving × seven days. Not a forecast or measured result. No household health effects are multiplied."}
      </p>
    </section>
  );
}
function communitySummary(hi: boolean, ready: boolean, kg: number) {
  if (!ready)
    return hi
      ? "पहले परिवार की योजना बनाएँ।"
      : "Build a household plan first to calculate a community scenario.";
  return hi
    ? `यदि हर सहभागी परिवार वही एक यात्री वाला परिदृश्य दोहराए तो लगभग ${kg.toFixed(1)} kg यात्रा CO₂/सप्ताह की बचत।`
    : `About ${kg.toFixed(1)} kg travel CO₂/week avoided if each participating household repeats the same single-commuter scenario.`;
}
function CommunityInputs({
  hi,
  kind,
  setKind,
  count,
  setCount,
  adoption,
  setAdoption,
}: {
  hi: boolean;
  kind: string;
  setKind: (value: string) => void;
  count: number;
  setCount: (value: number) => void;
  adoption: number;
  setAdoption: (value: number) => void;
}) {
  return (
    <div className="form-grid">
      <label>
        {hi ? "समुदाय का प्रकार" : "Community type"}
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="Neighbourhood">
            {hi ? "मोहल्ला" : "Neighbourhood"}
          </option>
          <option value="School">{hi ? "स्कूल" : "School"}</option>
          <option value="Apartment society">
            {hi ? "आवास समिति" : "Apartment society"}
          </option>
        </select>
      </label>
      <label>
        {hi ? "परिवार" : "Households"}
        <input
          type="number"
          min={1}
          max={10000}
          step={1}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
      </label>
      <label>
        {hi ? "भागीदारी" : "Participation"}: {adoption}%
        <input
          type="range"
          min={0}
          max={100}
          value={adoption}
          onChange={(e) => setAdoption(Number(e.target.value))}
        />
      </label>
    </div>
  );
}

function CommunityNotice({ hi, notice }: { hi: boolean; notice: string }) {
  const { t, setNotice } = useHawa();
  return (
    <div className="panel">
      <h2>
        {hi ? "सूचना-पट / WhatsApp संदेश" : "Notice-board / WhatsApp text"}
      </h2>
      <p>{notice}</p>
      <div className="button-row">
        <button
          onClick={() => {
            void (
              navigator.clipboard?.writeText(notice) ??
              Promise.reject(new Error("Clipboard unavailable"))
            ).then(
              () => setNotice("Community notice copied."),
              () =>
                setNotice(
                  "Clipboard unavailable. Select the notice text to copy it.",
                ),
            );
          }}
        >
          {hi ? "संदेश कॉपी करें" : "Copy notice"}
        </button>
        <button onClick={() => window.print()}>{t.print}</button>
      </div>
    </div>
  );
}
