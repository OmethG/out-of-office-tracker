import { ENTITLEMENT, FREE_MEDICAL } from '../../lib/leaveRules';

// The rules staff ask about most, shown on the Account tab. The numbers come from the app's own settings.
export default function LeaveRules() {
  const rules = [
    { icon: '½', title: 'Half day', text: 'Morning 9 AM – 1 PM or afternoon 1 – 5 PM. Uses half a day.' },
    { icon: 'Sa', title: 'Saturdays', text: "Count as half a day, since work ends at 1 PM. Sundays aren't counted." },
    { icon: '＋', title: 'Medical leave', text: `Choose Casual, then Medical. The first ${FREE_MEDICAL} a year need only a reason. From the ${FREE_MEDICAL + 1}th, attach a certificate.` },
    { icon: '◷', title: 'Short leave', text: "A few hours for personal matters. Doesn't use your leave days." },
    { icon: '⇥', title: 'Step out', text: 'Out for work for over an hour. Tap "I\'m back" when you return.', so: true },
    { icon: '✓', title: 'Approval', text: 'Days come off once your manager approves. You can cancel before it starts.', so: true },
  ];
  return (
    <section className="rules" aria-labelledby="rules-h">
      <div className="rules-h">
        <h2 id="rules-h">Leave rules</h2>
        <span>1 Apr – 31 Mar</span>
      </div>
      <div className="allow">
        <div className="an"><b>{ENTITLEMENT.annual}</b><small>Annual days</small></div>
        <div className="ca"><b>{ENTITLEMENT.casual}</b><small>Casual days</small></div>
      </div>
      <p className="allow-n">{ENTITLEMENT.annual + ENTITLEMENT.casual} days of leave each year.</p>
      <div className="rl">
        {rules.map((r) => (
          <div key={r.title}>
            <i className={r.so ? 'so' : ''} aria-hidden="true">{r.icon}</i>
            <b>{r.title}</b>
            <span>{r.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
