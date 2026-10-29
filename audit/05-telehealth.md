# Area E: Telehealth Infrastructure & Safety Audit

**Reviewer:** Senior WebRTC / Telehealth Systems Engineer & Clinical Safety Reviewer  
**Artifact:** `./audit/05-telehealth.md`  
**Finding Severity:** CRITICAL (P0)

---

## 1. Media & Signaling Layer Reality Check

The application UI claims:
> *"Encrypted consultation room initialized (256-bit AES). Australian Privacy Principles compliant."* (`src/app/telehealth/[roomId]/page.tsx:97`)

### Technical Reality in Codebase:
1. **Zero Multi-Party Video / WebRTC Signaling:**  
   The page calls `navigator.mediaDevices.getUserMedia({ video: true, audio: true })` (`page.tsx:148`) and pipes the local camera directly into `<video ref={videoRef} />`.  
   There is **no `RTCPeerConnection`**, no STUN/TURN server configuration, no WebSocket signaling server, and no third-party WebRTC SDK (Daily.co, LiveKit, Agora, Twilio Video). If Luke and a patient join the same URL simultaneously, neither participant can see or hear the other.
2. **Local-Only Chat State:**  
   Chat messages are stored in an in-memory React state array (`messages`, `page.tsx:96`). Sending a message executes `setMessages(prev => [...prev, newMsg])` (`page.tsx:244`). Messages are not sent across the network; they exist only in the local tab.
3. **Verdict:** The telehealth page is currently a visual wireframe/prototype, not a functional clinical video conferencing system.

---

## 2. Catastrophic Data Leak: The Missing Room Fallback

**Location:** `src/app/telehealth/[roomId]/page.tsx:191-201`
```typescript
// 1. Find appointment by telehealth_room_id or id
const { data: apptData } = await supabase
  .from('mmh_appointments')
  .select('*, service:mmh_services(*)')
  .or(`telehealth_room_id.eq.${roomId},id.eq.${roomId}`)
  .maybeSingle();

let currentAppt = apptData as MMHAppointment | null;

// Fallback if testing ad-hoc room
if (!currentAppt) {
  const { data: defaultAppt } = await supabase
    .from('mmh_appointments')
    .select('*, service:mmh_services(*)')
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  currentAppt = defaultAppt as MMHAppointment | null;
}

setAppointment(currentAppt);
```

### Exploit & Impact Analysis:
- If any visitor opens `/telehealth/nonexistent-id`, `apptData` returns null.
- The fallback immediately executes: `SELECT * FROM mmh_appointments ORDER BY scheduled_at DESC LIMIT 1`.
- **The page loads the most recent appointment of a completely unrelated patient**, displaying:
  - Patient Full Name
  - Patient Email & Phone
  - Appointment Notes (e.g. *"Reports workplace burnout, clavicular breathing, high autonomic stress."*)
  - Clinician SOAP Note history and screener submissions!
- **Severity: P0 Data Breach Hazard.** Any random URL access exposes patient clinical records.

---

## 3. Role Assignment via URL Query Parameter

**Location:** `src/app/telehealth/[roomId]/page.tsx:81-84`
```typescript
const initialRole = searchParams.get('role') === 'client' ? 'client' : 'clinician';
const [activeRole, setActiveRole] = useState<'clinician' | 'client'>(initialRole);
```
- **Vulnerability:** Access to Luke's clinician workbench (SOAP note editor, screener dispatcher, patient profile viewer) is determined solely by inspecting the URL query parameter `?role=`.
- In fact, if the URL has no role parameter, it **defaults to `'clinician'`**!
- Any patient or third party opening `/telehealth/[roomId]` without `?role=client` is handed Luke's complete clinician interface and SOAP note editor.

---

## 4. Telehealth Clinical Safety Deficits

1. **No Client Physical Location Capture:**  
   National telehealth standards (PACFA, Ahpra, RACGP) require capturing the client's physical location at the beginning of every telehealth session. If an interstate client experiences a medical or psychiatric crisis, the clinician cannot dispatch local triple zero (000) emergency services without knowing their current physical address.
2. **No Connection-Loss / Phone Fallback:**  
   If video disconnects, there is no automated backup prompt displaying Luke's direct telephone contact or protocol for re-establishing contact.
3. **Guessable Room IDs:**  
   Room IDs are generated using `Math.random().toString(36)` (`src/app/api/webhooks/booking/route.ts:34`) or predictable slugs (`mmh-sarah-j-telehealth`). They lack cryptographically secure entropy (`crypto.randomUUID()`) and do not expire.

---

## 5. Required Specification for Fix (Area E)

1. **Eliminate Arbitrary Client Fallback Immediately:**
   Delete lines 191-199 in `src/app/telehealth/[roomId]/page.tsx`. If `apptData` is null, render a strict error: `<RoomNotFoundMessage />`. Never load an arbitrary appointment.
2. **Enforce Server-Side Role Authentication:**
   Determine role by checking authenticated Supabase session (`session.user.email === 'luke@mightymentalhealth.com.au'`). Never trust `?role=` query parameter.
3. **Integrate Real WebRTC Provider or Embedded Secure Meeting:**
   Replace the dummy video loop with a battle-tested Australian/compliant telehealth provider (e.g. Daily.co Sydney region, LiveKit Cloud, or Whereby Embedded) with room access tokens and waiting rooms.
4. **Mandatory Location Confirmation:**
   Add a pre-call modal for patients: *"Please confirm your physical location during this call for emergency safety requirements."*
