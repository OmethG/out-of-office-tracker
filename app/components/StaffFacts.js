import { CakeIcon, CalendarIcon } from './Icons';
import { birthdayLabel, birthdayWhen, joinedLabel, tenureLabel } from '../../lib/staffDates';

// The Joined and Birthday boxes on a person's page. Staff don't see a box that has no date yet;
// the manager does ("Not added yet"), so he knows what's missing.
export default function StaffFacts({ profile, showEmpty = false }) {
  const { joined, birthday } = profile;
  return (
    <>
      {(joined || showEmpty) && (
        <div className="fact">
          <span className="fi"><CalendarIcon /></span>
          <small>Joined</small>
          {joined ? <b>{joinedLabel(joined)}</b> : <b className="none">Not added yet</b>}
          {joined && <span>{tenureLabel(joined)}</span>}
        </div>
      )}
      {(birthday || showEmpty) && (
        <div className="fact">
          <span className="fi bd"><CakeIcon /></span>
          <small>Birthday</small>
          {birthday ? <b>{birthdayLabel(birthday)}</b> : <b className="none">Not added yet</b>}
          {birthday && <span>{birthdayWhen(birthday)}</span>}
        </div>
      )}
    </>
  );
}
