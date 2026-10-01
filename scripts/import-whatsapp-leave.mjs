// One-off: loads leave taken since 1 April 2026 (from the "Leave updates - MethG" WhatsApp group)
// into the app as approved requests, so everyone's leave balance starts out right.
// Checked against MethG-leave-since-April-2026.xlsx. Safe to run more than once: rows already loaded are skipped.
//
//   Preview:  node --env-file=.env.local scripts/import-whatsapp-leave.mjs
//   Load it:  node --env-file=.env.local scripts/import-whatsapp-leave.mjs --yes

import pg from 'pg';
import { readFileSync } from 'node:fs';

const LEAVE = [
 {
  "key": "wa-2026-01",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-04-02",
  "end": "2026-04-02",
  "half": null,
  "days": null,
  "from": "2026-04-02T15:00:00+05:30",
  "to": "2026-04-02T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-04-02T14:03:00+05:30"
 },
 {
  "key": "wa-2026-02",
  "name": "Gayan",
  "type": "short",
  "category": null,
  "start": "2026-04-07",
  "end": "2026-04-07",
  "half": null,
  "days": null,
  "from": "2026-04-07T15:00:00+05:30",
  "to": "2026-04-07T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-04-07T14:37:00+05:30"
 },
 {
  "key": "wa-2026-03",
  "name": "Priya",
  "type": "full",
  "category": "casual",
  "start": "2026-04-07",
  "end": "2026-04-07",
  "half": null,
  "days": 1,
  "from": "2026-04-07T09:00:00+05:30",
  "to": "2026-04-07T17:00:00+05:30",
  "reason": "Urgent personal matter (from the WhatsApp group)",
  "sent": "2026-04-07T06:36:00+05:30"
 },
 {
  "key": "wa-2026-04",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-04-10",
  "end": "2026-04-10",
  "half": null,
  "days": null,
  "from": "2026-04-10T15:00:00+05:30",
  "to": "2026-04-10T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-04-10T13:41:00+05:30"
 },
 {
  "key": "wa-2026-05",
  "name": "Priya",
  "type": "full",
  "category": "casual",
  "start": "2026-04-21",
  "end": "2026-04-21",
  "half": null,
  "days": 1,
  "from": "2026-04-21T09:00:00+05:30",
  "to": "2026-04-21T17:00:00+05:30",
  "reason": "Medical check-up (from the WhatsApp group)",
  "sent": "2026-04-21T08:15:00+05:30"
 },
 {
  "key": "wa-2026-06",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-04-23",
  "end": "2026-04-23",
  "half": null,
  "days": null,
  "from": "2026-04-23T15:00:00+05:30",
  "to": "2026-04-23T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-04-23T14:39:00+05:30"
 },
 {
  "key": "wa-2026-07",
  "name": "Dulhan",
  "type": "full",
  "category": "casual",
  "start": "2026-04-30",
  "end": "2026-04-30",
  "half": null,
  "days": 1,
  "from": "2026-04-30T09:00:00+05:30",
  "to": "2026-04-30T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-04-30T07:34:00+05:30"
 },
 {
  "key": "wa-2026-08",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-05-14",
  "end": "2026-05-14",
  "half": null,
  "days": null,
  "from": "2026-05-14T15:30:00+05:30",
  "to": "2026-05-14T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-05-14T15:35:00+05:30"
 },
 {
  "key": "wa-2026-09",
  "name": "Dulhan",
  "type": "short",
  "category": null,
  "start": "2026-05-19",
  "end": "2026-05-19",
  "half": null,
  "days": null,
  "from": "2026-05-19T09:00:00+05:30",
  "to": "2026-05-19T11:00:00+05:30",
  "reason": "Campus (from the WhatsApp group)",
  "sent": "2026-05-18T21:40:00+05:30"
 },
 {
  "key": "wa-2026-10",
  "name": "Kavee",
  "type": "full",
  "category": "annual",
  "start": "2026-05-19",
  "end": "2026-05-19",
  "half": null,
  "days": 1,
  "from": "2026-05-19T09:00:00+05:30",
  "to": "2026-05-19T17:00:00+05:30",
  "reason": "Personal matter (from the WhatsApp group)",
  "sent": "2026-05-18T18:42:00+05:30"
 },
 {
  "key": "wa-2026-11",
  "name": "Chamindu",
  "type": "full",
  "category": "annual",
  "start": "2026-05-22",
  "end": "2026-05-22",
  "half": null,
  "days": 1,
  "from": "2026-05-22T09:00:00+05:30",
  "to": "2026-05-22T17:00:00+05:30",
  "reason": "Personal matter (from the WhatsApp group)",
  "sent": "2026-05-21T20:38:00+05:30"
 },
 {
  "key": "wa-2026-12",
  "name": "Gayan",
  "type": "short",
  "category": null,
  "start": "2026-05-22",
  "end": "2026-05-22",
  "half": null,
  "days": null,
  "from": "2026-05-22T16:00:00+05:30",
  "to": "2026-05-22T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-05-22T14:50:00+05:30"
 },
 {
  "key": "wa-2026-13",
  "name": "Gayan",
  "type": "half",
  "category": "annual",
  "start": "2026-05-23",
  "end": "2026-05-23",
  "half": "morning",
  "days": 0.5,
  "from": "2026-05-23T09:00:00+05:30",
  "to": "2026-05-23T13:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-05-22T14:50:00+05:30"
 },
 {
  "key": "wa-2026-14",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-05-27",
  "end": "2026-05-27",
  "half": null,
  "days": null,
  "from": "2026-05-27T15:00:00+05:30",
  "to": "2026-05-27T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-05-27T14:56:00+05:30"
 },
 {
  "key": "wa-2026-15",
  "name": "Priya",
  "type": "full",
  "category": "casual",
  "start": "2026-05-27",
  "end": "2026-05-27",
  "half": null,
  "days": 1,
  "from": "2026-05-27T09:00:00+05:30",
  "to": "2026-05-27T17:00:00+05:30",
  "reason": "Urgent matter (from the WhatsApp group)",
  "sent": "2026-05-27T05:39:00+05:30"
 },
 {
  "key": "wa-2026-16",
  "name": "Dulhan",
  "type": "half",
  "category": "annual",
  "start": "2026-05-29",
  "end": "2026-05-29",
  "half": "morning",
  "days": 0.5,
  "from": "2026-05-29T09:00:00+05:30",
  "to": "2026-05-29T13:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-05-28T17:23:00+05:30"
 },
 {
  "key": "wa-2026-17",
  "name": "Sachini",
  "type": "full",
  "category": "casual",
  "start": "2026-05-29",
  "end": "2026-05-29",
  "half": null,
  "days": 1,
  "from": "2026-05-29T09:00:00+05:30",
  "to": "2026-05-29T17:00:00+05:30",
  "reason": "Illness (from the WhatsApp group)",
  "sent": "2026-05-29T07:25:00+05:30"
 },
 {
  "key": "wa-2026-18",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-06-04",
  "end": "2026-06-04",
  "half": null,
  "days": null,
  "from": "2026-06-04T15:00:00+05:30",
  "to": "2026-06-04T17:00:00+05:30",
  "reason": "Appointment (from the WhatsApp group)",
  "sent": "2026-06-04T14:56:00+05:30"
 },
 {
  "key": "wa-2026-19",
  "name": "Kavee",
  "type": "full",
  "category": "casual",
  "start": "2026-06-10",
  "end": "2026-06-10",
  "half": null,
  "days": 1,
  "from": "2026-06-10T09:00:00+05:30",
  "to": "2026-06-10T17:00:00+05:30",
  "reason": "Fever (hospital ETU) (from the WhatsApp group)",
  "sent": "2026-06-10T12:45:00+05:30"
 },
 {
  "key": "wa-2026-20",
  "name": "Priya",
  "type": "full",
  "category": "casual",
  "start": "2026-06-13",
  "end": "2026-06-13",
  "half": null,
  "days": 0.5,
  "from": "2026-06-13T09:00:00+05:30",
  "to": "2026-06-13T13:00:00+05:30",
  "reason": "Almsgiving (from the WhatsApp group)",
  "sent": "2026-06-13T08:15:00+05:30"
 },
 {
  "key": "wa-2026-21",
  "name": "Dulhan",
  "type": "full",
  "category": "annual",
  "start": "2026-06-19",
  "end": "2026-06-19",
  "half": null,
  "days": 1,
  "from": "2026-06-19T09:00:00+05:30",
  "to": "2026-06-19T17:00:00+05:30",
  "reason": "Almsgiving (from the WhatsApp group)",
  "sent": "2026-06-18T15:22:00+05:30"
 },
 {
  "key": "wa-2026-22",
  "name": "Sachini",
  "type": "full",
  "category": "casual",
  "start": "2026-06-19",
  "end": "2026-06-19",
  "half": null,
  "days": 1,
  "from": "2026-06-19T09:00:00+05:30",
  "to": "2026-06-19T17:00:00+05:30",
  "reason": "Personal matter (from the WhatsApp group)",
  "sent": "2026-06-19T06:56:00+05:30"
 },
 {
  "key": "wa-2026-23",
  "name": "Gayan",
  "type": "full",
  "category": "casual",
  "start": "2026-06-22",
  "end": "2026-06-22",
  "half": null,
  "days": 1,
  "from": "2026-06-22T09:00:00+05:30",
  "to": "2026-06-22T17:00:00+05:30",
  "reason": "Urgent work at institute (from the WhatsApp group)",
  "sent": "2026-06-21T21:35:00+05:30"
 },
 {
  "key": "wa-2026-24",
  "name": "Kavee",
  "type": "full",
  "category": "casual",
  "start": "2026-06-22",
  "end": "2026-06-22",
  "half": null,
  "days": 1,
  "from": "2026-06-22T09:00:00+05:30",
  "to": "2026-06-22T17:00:00+05:30",
  "reason": "Travelling back from Anuradhapura (from the WhatsApp group)",
  "sent": "2026-06-22T06:55:00+05:30"
 },
 {
  "key": "wa-2026-25",
  "name": "Chamindu",
  "type": "short",
  "category": null,
  "start": "2026-07-16",
  "end": "2026-07-16",
  "half": null,
  "days": null,
  "from": "2026-07-16T15:30:00+05:30",
  "to": "2026-07-16T17:00:00+05:30",
  "reason": "Personal matter (from the WhatsApp group)",
  "sent": "2026-07-16T15:26:00+05:30"
 },
 {
  "key": "wa-2026-26",
  "name": "Gayan",
  "type": "half",
  "category": "casual",
  "start": "2026-07-16",
  "end": "2026-07-16",
  "half": "morning",
  "days": 0.5,
  "from": "2026-07-16T09:00:00+05:30",
  "to": "2026-07-16T13:00:00+05:30",
  "reason": "Medical check-up (from the WhatsApp group)",
  "sent": "2026-07-15T22:19:00+05:30"
 },
 {
  "key": "wa-2026-27",
  "name": "Gayan",
  "type": "half",
  "category": "casual",
  "start": "2026-07-17",
  "end": "2026-07-17",
  "half": "morning",
  "days": 0.5,
  "from": "2026-07-17T09:00:00+05:30",
  "to": "2026-07-17T13:00:00+05:30",
  "reason": "Medical check-up (from the WhatsApp group)",
  "sent": "2026-07-15T22:19:00+05:30"
 },
 {
  "key": "wa-2026-28",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-07-17",
  "end": "2026-07-17",
  "half": null,
  "days": null,
  "from": "2026-07-17T15:30:00+05:30",
  "to": "2026-07-17T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-07-17T15:33:00+05:30"
 },
 {
  "key": "wa-2026-29",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-07-21",
  "end": "2026-07-21",
  "half": null,
  "days": null,
  "from": "2026-07-21T15:00:00+05:30",
  "to": "2026-07-21T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-07-21T14:37:00+05:30"
 },
 {
  "key": "wa-2026-30",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-07-22",
  "end": "2026-07-22",
  "half": null,
  "days": null,
  "from": "2026-07-22T10:30:00+05:30",
  "to": "2026-07-22T12:30:00+05:30",
  "reason": "Wedding (from the WhatsApp group)",
  "sent": "2026-07-22T10:16:00+05:30"
 },
 {
  "key": "wa-2026-31",
  "name": "Sachini",
  "type": "short",
  "category": null,
  "start": "2026-07-24",
  "end": "2026-07-24",
  "half": null,
  "days": null,
  "from": "2026-07-24T09:00:00+05:30",
  "to": "2026-07-24T11:00:00+05:30",
  "reason": "Academic (from the WhatsApp group)",
  "sent": "2026-07-24T06:51:00+05:30"
 },
 {
  "key": "wa-2026-32",
  "name": "Chamindu",
  "type": "short",
  "category": null,
  "start": "2026-07-31",
  "end": "2026-07-31",
  "half": null,
  "days": null,
  "from": "2026-07-31T15:00:00+05:30",
  "to": "2026-07-31T17:00:00+05:30",
  "reason": "University (from the WhatsApp group)",
  "sent": "2026-07-31T14:33:00+05:30"
 },
 {
  "key": "wa-2026-33",
  "name": "Priya",
  "type": "full",
  "category": "casual",
  "start": "2026-08-03",
  "end": "2026-08-03",
  "half": null,
  "days": 1,
  "from": "2026-08-03T09:00:00+05:30",
  "to": "2026-08-03T17:00:00+05:30",
  "reason": "Fever (from the WhatsApp group)",
  "sent": "2026-08-03T07:59:00+05:30"
 },
 {
  "key": "wa-2026-34",
  "name": "Gayan",
  "type": "full",
  "category": "casual",
  "start": "2026-08-07",
  "end": "2026-08-07",
  "half": null,
  "days": 1,
  "from": "2026-08-07T09:00:00+05:30",
  "to": "2026-08-07T17:00:00+05:30",
  "reason": "Funeral (from the WhatsApp group)",
  "sent": "2026-08-06T15:53:00+05:30"
 },
 {
  "key": "wa-2026-35",
  "name": "Kavee",
  "type": "full",
  "category": "casual",
  "start": "2026-08-07",
  "end": "2026-08-07",
  "half": null,
  "days": 1,
  "from": "2026-08-07T09:00:00+05:30",
  "to": "2026-08-07T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-08-07T07:07:00+05:30"
 },
 {
  "key": "wa-2026-36",
  "name": "Priya",
  "type": "full",
  "category": "casual",
  "start": "2026-08-08",
  "end": "2026-08-08",
  "half": null,
  "days": 0.5,
  "from": "2026-08-08T09:00:00+05:30",
  "to": "2026-08-08T13:00:00+05:30",
  "reason": "Personal matter (from the WhatsApp group)",
  "sent": "2026-08-08T08:33:00+05:30"
 },
 {
  "key": "wa-2026-37",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-08-10",
  "end": "2026-08-10",
  "half": null,
  "days": null,
  "from": "2026-08-10T09:00:00+05:30",
  "to": "2026-08-10T11:00:00+05:30",
  "reason": "Mother's eye operation (from the WhatsApp group)",
  "sent": "2026-08-10T05:31:00+05:30"
 },
 {
  "key": "wa-2026-38",
  "name": "Priya",
  "type": "full",
  "category": "casual",
  "start": "2026-08-11",
  "end": "2026-08-12",
  "half": null,
  "days": 2,
  "from": "2026-08-11T09:00:00+05:30",
  "to": "2026-08-12T17:00:00+05:30",
  "reason": "Foot problem (from the WhatsApp group)",
  "sent": "2026-08-11T08:50:00+05:30"
 },
 {
  "key": "wa-2026-39",
  "name": "Dulhan",
  "type": "short",
  "category": null,
  "start": "2026-08-14",
  "end": "2026-08-14",
  "half": null,
  "days": null,
  "from": "2026-08-14T16:00:00+05:30",
  "to": "2026-08-14T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-08-14T16:12:00+05:30"
 },
 {
  "key": "wa-2026-40",
  "name": "Kavee",
  "type": "half",
  "category": "casual",
  "start": "2026-08-14",
  "end": "2026-08-14",
  "half": "afternoon",
  "days": 0.5,
  "from": "2026-08-14T13:00:00+05:30",
  "to": "2026-08-14T17:00:00+05:30",
  "reason": "Food poisoning (from the WhatsApp group)",
  "sent": "2026-08-14T12:56:00+05:30"
 },
 {
  "key": "wa-2026-41",
  "name": "Priya",
  "type": "full",
  "category": "annual",
  "start": "2026-08-17",
  "end": "2026-08-17",
  "half": null,
  "days": 1,
  "from": "2026-08-17T09:00:00+05:30",
  "to": "2026-08-17T17:00:00+05:30",
  "reason": "Urgent personal matter (from the WhatsApp group)",
  "sent": "2026-08-17T07:23:00+05:30"
 },
 {
  "key": "wa-2026-42",
  "name": "Gayan",
  "type": "short",
  "category": null,
  "start": "2026-08-25",
  "end": "2026-08-25",
  "half": null,
  "days": null,
  "from": "2026-08-25T15:00:00+05:30",
  "to": "2026-08-25T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-08-25T14:04:00+05:30"
 },
 {
  "key": "wa-2026-43",
  "name": "Dulhan",
  "type": "full",
  "category": "annual",
  "start": "2026-08-28",
  "end": "2026-08-28",
  "half": null,
  "days": 1,
  "from": "2026-08-28T09:00:00+05:30",
  "to": "2026-08-28T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-08-27T13:15:00+05:30"
 },
 {
  "key": "wa-2026-44",
  "name": "Gayan",
  "type": "full",
  "category": "annual",
  "start": "2026-08-28",
  "end": "2026-08-28",
  "half": null,
  "days": 1,
  "from": "2026-08-28T09:00:00+05:30",
  "to": "2026-08-28T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-08-27T19:15:00+05:30"
 },
 {
  "key": "wa-2026-45",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-08-31",
  "end": "2026-08-31",
  "half": null,
  "days": null,
  "from": "2026-08-31T15:00:00+05:30",
  "to": "2026-08-31T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-08-31T15:04:00+05:30"
 },
 {
  "key": "wa-2026-46",
  "name": "Priya",
  "type": "full",
  "category": "annual",
  "start": "2026-09-02",
  "end": "2026-09-02",
  "half": null,
  "days": 1,
  "from": "2026-09-02T09:00:00+05:30",
  "to": "2026-09-02T17:00:00+05:30",
  "reason": "Urgent personal matter (from the WhatsApp group)",
  "sent": "2026-09-01T21:08:00+05:30"
 },
 {
  "key": "wa-2026-47",
  "name": "Dulhan",
  "type": "half",
  "category": "casual",
  "start": "2026-09-07",
  "end": "2026-09-07",
  "half": "afternoon",
  "days": 0.5,
  "from": "2026-09-07T13:00:00+05:30",
  "to": "2026-09-07T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-09-07T10:25:00+05:30"
 },
 {
  "key": "wa-2026-48",
  "name": "Priya",
  "type": "full",
  "category": "annual",
  "start": "2026-09-08",
  "end": "2026-09-08",
  "half": null,
  "days": 1,
  "from": "2026-09-08T09:00:00+05:30",
  "to": "2026-09-08T17:00:00+05:30",
  "reason": "Urgent personal matter (from the WhatsApp group)",
  "sent": "2026-09-08T00:18:00+05:30"
 },
 {
  "key": "wa-2026-49",
  "name": "Kavee",
  "type": "full",
  "category": "annual",
  "start": "2026-09-10",
  "end": "2026-09-10",
  "half": null,
  "days": 1,
  "from": "2026-09-10T09:00:00+05:30",
  "to": "2026-09-10T17:00:00+05:30",
  "reason": "Personal matter (from the WhatsApp group)",
  "sent": "2026-09-09T16:44:00+05:30"
 },
 {
  "key": "wa-2026-50",
  "name": "Gayan",
  "type": "short",
  "category": null,
  "start": "2026-09-25",
  "end": "2026-09-25",
  "half": null,
  "days": null,
  "from": "2026-09-25T15:30:00+05:30",
  "to": "2026-09-25T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-09-25T14:52:00+05:30"
 },
 {
  "key": "wa-2026-51",
  "name": "Maheshi",
  "type": "short",
  "category": null,
  "start": "2026-09-25",
  "end": "2026-09-25",
  "half": null,
  "days": null,
  "from": "2026-09-25T14:30:00+05:30",
  "to": "2026-09-25T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-09-25T13:58:00+05:30"
 },
 {
  "key": "wa-2026-52",
  "name": "Sachini",
  "type": "short",
  "category": null,
  "start": "2026-09-25",
  "end": "2026-09-25",
  "half": null,
  "days": null,
  "from": "2026-09-25T15:30:00+05:30",
  "to": "2026-09-25T17:00:00+05:30",
  "reason": "No reason given (from the WhatsApp group)",
  "sent": "2026-09-25T15:05:00+05:30"
 },
 {
  "key": "wa-2026-53",
  "name": "Kavee",
  "type": "short",
  "category": null,
  "start": "2026-09-29",
  "end": "2026-09-29",
  "half": null,
  "days": null,
  "from": "2026-09-29T15:45:00+05:30",
  "to": "2026-09-29T17:00:00+05:30",
  "reason": "Personal matter (from the WhatsApp group)",
  "sent": "2026-09-29T15:42:00+05:30"
 }
];

const employees = JSON.parse(readFileSync(new URL('../config/employees.json', import.meta.url), 'utf8'));
const emailOf = Object.fromEntries(employees.map((e) => [e.name, e.email]));
const write = process.argv.includes('--yes');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Run this from the leave-tracker folder with --env-file=.env.local');
  process.exit(1);
}
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const db = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
await db.connect();

// Same columns the app adds on start-up, in case this runs before the new version has been opened.
await db.query(`
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'step_out';
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type TEXT;
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS start_date DATE;
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS end_date DATE;
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS half TEXT;
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days NUMERIC(5,1);
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS checkin_on BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE leave_requests ALTER COLUMN checkin_on SET DEFAULT true;
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_category TEXT;
`);

const { rows: existing } = await db.query("SELECT decision_token FROM leave_requests WHERE decision_token LIKE 'wa-2026-%'");
const have = new Set(existing.map((r) => r.decision_token));
const todo = LEAVE.filter((l) => !have.has(l.key));
console.log(`${LEAVE.length} leave records from the WhatsApp group. ${have.size} already loaded, ${todo.length} to add.`);

if (write && todo.length) {
  await db.query('BEGIN');
  try {
    for (const l of todo) {
      await db.query(
        `INSERT INTO leave_requests
          (kind, leave_type, leave_category, start_date, end_date, half, days, employee_name, employee_email,
           leave_time, expected_return_time, reason, status, decision_token, created_at, decided_at, checkin_on)
         VALUES ('leave', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'approved', $12, $13, $13, false)
         ON CONFLICT (decision_token) DO NOTHING`,
        [l.type, l.category, l.start, l.end, l.type === 'half' ? l.half : null, l.days, l.name, emailOf[l.name] || null,
         l.from, l.to, l.reason, l.key, l.sent]
      );
    }
    await db.query('COMMIT');
    console.log(`Added ${todo.length}.`);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Nothing was added:', err.message);
    process.exit(1);
  }
} else if (!write) {
  console.log('Preview only. Run again with --yes to load them.');
}

// Leave used this leave year (1 Apr 2026 – 31 Mar 2027), approved only, from everything in the app.
const { rows: totals } = await db.query(
  `SELECT employee_name AS name,
          COALESCE(SUM(days) FILTER (WHERE leave_type <> 'short' AND COALESCE(leave_category, 'annual') = 'annual'), 0) AS annual,
          COALESCE(SUM(days) FILTER (WHERE leave_category = 'casual'), 0) AS casual,
          COUNT(*) FILTER (WHERE leave_type = 'short') AS short
   FROM leave_requests
   WHERE kind = 'leave' AND status = 'approved' AND start_date BETWEEN '2026-04-01' AND '2027-03-31'
   GROUP BY employee_name ORDER BY employee_name`
);
console.log(write ? 'Leave used now in the app:' : 'Leave used in the app right now (before loading):');
console.table(totals.map((t) => ({ name: t.name, annual: Number(t.annual), casual: Number(t.casual), 'days left': 21 - Number(t.annual) - Number(t.casual), short: Number(t.short) })));
await db.end();
