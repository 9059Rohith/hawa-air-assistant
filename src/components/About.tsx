"use client";
import Link from "next/link";
import { useHawa } from "./Provider";
import factors from "@/data/emission-factors.json";
export function About() {
  const { profile } = useHawa();
  const hi = profile.lang === "hi";
  return (
    <>
      <section className="hero compact">
        <h1>
          {hi ? "स्पष्ट सलाह। खुले अनुमान।" : "Clear advice. Open assumptions."}
        </h1>
        <p>
          {hi
            ? "HAWA विकल्प समझने में मदद करता है। यह निदान, निजी प्रदूषण माप या स्वास्थ्य की गारंटी नहीं है।"
            : "HAWA helps compare practical choices. It does not diagnose, measure personal exposure or promise health outcomes."}
        </p>
      </section>
      <section className="prose">
        <h2>
          {hi
            ? "गणना कोड से, भाषा AI से"
            : "Numbers come from code, language from AI"}
        </h2>
        <p>
          {hi
            ? "AI चुने गए स्रोतों से छोटे स्पष्टीकरण लिखता है। कोड गणना करता है। अमान्य उत्तर पर वही नियम आधारित योजना मिलती है।"
            : "AI writes short explanations from selected guidance. Tested deterministic functions calculate impacts. Invalid model output falls back to the same rules-based plan. Validation reduces risk; it cannot prove every generated sentence correct."}
        </p>
        <h2>{hi ? "एक्सपोज़र का उदाहरण" : "Exposure scenario"}</h2>
        <p>
          {hi
            ? "बाहर का PM2.5 एक दिन स्थिर माना जाता है। कमरे का आयतन = क्षेत्रफल × छत की ऊँचाई। प्रवेश अनुपात बंद/सामान्य/रिसाव वाली खिड़कियों के लिए 0.3/0.5/0.7 है।"
            : "Outdoor PM2.5 is held constant for a day. Room volume = area × entered ceiling height. Infiltration is 0.3/0.5/0.7 for sealed/typical/leaky windows."}
        </p>
        <p>
          {hi
            ? "अंदर = बाहर × प्रवेश अनुपात × 0.5 / (0.5 + CADR/आयतन)। बाहर का संपर्क = PM × घंटे × मास्क प्रवेश × गतिविधि गुणांक। आराम/चलना/दौड़ना = 1/1.5/3; बिना मास्क/कपड़ा/सर्जिकल/N95 = 1/0.9/0.7/0.2। ये अनुमान हैं, वास्तविक फिट या साँस की मात्रा नहीं।"
            : "Indoor concentration = outdoor × infiltration × 0.5 / (0.5 + CADR/volume). Outdoor exposure = PM × hours × mask penetration × activity multiplier. Rest/walking/running = 1/1.5/3; none/cloth/surgical/N95 penetration = 1/0.9/0.7/0.2. These are uncertain scenario assumptions, not measurements of fit or inhalation."}
        </p>
        <p>
          {hi
            ? "एक बाहरी घंटा अंदर करने और फ़िल्टर के 4 ACH पर असर दोबारा गणना किया जाता है; प्रतिशत जोड़े नहीं जाते। सिगरेट-समतुल्य के लिए गतिविधि रहित संपर्क बदलाव ÷ 24 ÷ 22 केवल समझाने का उदाहरण है।"
            : "Replacing one outdoor hour and adding a four-ACH filter triggers a full recalculation; overlapping percentages never add. Cigarette equivalence uses unweighted concentration-time change ÷ 24 ÷ 22 as a communication aid, not smoking history or disease risk. Indoor sources, gases, changing weather and individual physiology are excluded."}
        </p>
        <h2>
          {hi ? "यात्रा उत्सर्जन के स्रोत" : "Travel factors and uncertainty"}
        </h2>
        <p>
          {hi
            ? "नीचे पुराने संदर्भ गुणांक हैं, वर्तमान वाहन बेड़े या जीवनचक्र का माप नहीं। वाहन-किमी को यात्रियों से बाँटते हैं; यात्री-किमी को दोबारा नहीं बाँटते। मेट्रो का मान अप्रमाणित परिदृश्य अनुमान है।"
            : "These dated reference factors estimate operational CO₂, not lifecycle CO₂e or a current fleet inventory. Vehicle-km factors are divided by occupancy; passenger-km factors are not divided again. Metro is explicitly an uncalibrated scenario assumption."}
        </p>
        <div className="table-scroll">
          <table>
            <caption>
              {hi ? "संदर्भ कार्बन गुणांक" : "Reference carbon factors"}
            </caption>
            <thead>
              <tr>
                <th>{hi ? "माध्यम" : "Mode"}</th>
                <th>{hi ? "मान और इकाई" : "Value and unit"}</th>
                <th>{hi ? "स्रोत और सीमा" : "Source and limit"}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(factors.transport).map(([name, f]) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  <td>
                    {f.value} {f.unit}
                  </td>
                  <td>
                    <a href={f.source}>{f.year}</a> · {f.uncertainty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {hi
            ? "समुदाय: एक यात्री की दैनिक बचत × 7 × परिवार × भागीदारी। स्वास्थ्य प्रभाव को गुणा नहीं करते। ईंधन के लिए Learn में अलग ऊर्जा कैलकुलेटर है।"
            : "Community = one commuter’s daily saving × seven × households × adoption. Health effects are never multiplied. Learn includes a separate input-energy fuel calculator; operating hours do not establish fuel consumption."}
        </p>
        <h2>{hi ? "डेटा और सुरक्षा" : "Data and safety"}</h2>
        <p>
          {hi
            ? "Open-Meteo / CAMS मॉडल अनुमान स्थानीय मॉनिटर से अलग हो सकते हैं। EPA 2024 PM2.5 पैमाना घंटेवार डेटा पर केवल संकेत है, आधिकारिक AQI या NowCast नहीं। भारत का PM2.5 बैंड भी समग्र CPCB AQI नहीं है।"
            : "Open-Meteo / CAMS model estimates can differ from monitors. EPA 2024 PM2.5 breakpoints applied to hourly data are indicative, not official AQI or NowCast. The India PM2.5 band is not overall CPCB AQI."}
        </p>
        <p>
          {hi
            ? "साँस की गंभीर तकलीफ़ में तुरंत चिकित्सा मदद लें। घर में कोयला या बंद जगह में जनरेटर न चलाएँ। फ़िल्टर कार्बन मोनोऑक्साइड नहीं हटाते। दवा न बदलें।"
            : "Urgent breathing symptoms need urgent medical care. Never burn charcoal indoors or run a generator in enclosed space. Particle filters do not remove carbon monoxide. Do not change medication based on HAWA."}
        </p>
        <h2>{hi ? "गोपनीयता और ऑफ़लाइन" : "Privacy and offline behavior"}</h2>
        <p>
          {hi
            ? "कोई खाता या ऐप एनालिटिक्स नहीं। प्रोफ़ाइल केवल Save चुनने पर ब्राउज़र में रहती है; भाषा और थीम अलग सहेजे जाते हैं। स्थान दो दशमलव तक गोल किया जाता है। ब्राउज़र सीधे Open-Meteo से डेटा लेता है, इसलिए प्रदाता IP देखता है। AI को संक्षिप्त प्रोफ़ाइल, चुने कदम और हाल की बातचीत भेजी जाती है, निर्देशांक नहीं।"
            : "No accounts or app analytics. Profiles persist only after Save; language and theme preferences are stored separately. Coordinates are rounded to two decimals. Your browser requests Open-Meteo directly, so the provider sees its IP. Online AI receives a compact household summary, selected guidance and recent conversation, not coordinates. Hosting providers may retain operational/security logs."}
        </p>
        <p>
          {hi
            ? "लोड होने के बाद नियम योजना, गणना, चैट, प्रिंट और JSON निर्यात बिना नेटवर्क चलते हैं। नए पेज या पहली बार ऐप खोलने के लिए इंटरनेट चाहिए। साझा लिंक में केवल सलाह ID और भाषा हैं।"
            : "Once the relevant app features are loaded, local rules plans, calculations, grounded chat, printing and JSON export work without network. First visits and uncached page loads require internet. Share links contain only guidance IDs and language. Clear removes the saved profile and current plan; browser site-data controls remove all caches and preferences."}
        </p>
        <h2>{hi ? "सुलभता" : "Accessibility"}</h2>
        <p>
          {hi
            ? "कीबोर्ड नेविगेशन, पाठ वाली तालिकाएँ, हिन्दी/English, उच्च कंट्रास्ट और ब्राउज़र पढ़कर सुनाने का समर्थन। स्वचालित जाँच मानव स्क्रीन-रीडर परीक्षण का विकल्प नहीं।"
            : "Keyboard navigation, chart tables, Hindi/English, high contrast and browser read-aloud are supported. Automated checks supplement, but do not replace, human screen-reader testing."}
        </p>
        <p>
          <Link href="/learn#sources">
            {hi ? "मूल स्रोत" : "Original sources"}
          </Link>{" "}
          ·{" "}
          <a href="https://github.com/9059Rohith/hawa-air-assistant">
            GitHub · MIT
          </a>
        </p>
      </section>
    </>
  );
}
