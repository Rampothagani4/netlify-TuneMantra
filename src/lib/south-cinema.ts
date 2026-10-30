// A hand-picked directory of South Indian film music: composers, playback
// singers and the stars whose songs listeners look for. Each person maps to a
// song search, so the Home screen can show their hits with one tap.

export type Industry = 'telugu' | 'tamil' | 'malayalam' | 'kannada'
export type Role = 'composer' | 'singer' | 'hero' | 'heroine'

export interface CinemaPerson {
  name: string
  role: Role
  /** Industries they mostly work in; the first one is their home industry. */
  industries: Industry[]
}

export const INDUSTRIES: { id: Industry | 'all'; label: string }[] = [
  { id: 'all', label: 'All South' },
  { id: 'telugu', label: 'Telugu' },
  { id: 'tamil', label: 'Tamil' },
  { id: 'malayalam', label: 'Malayalam' },
  { id: 'kannada', label: 'Kannada' },
]

export const ROLES: { id: Role; label: string; plural: string }[] = [
  { id: 'composer', label: 'Music director', plural: 'Music directors' },
  { id: 'singer', label: 'Singer', plural: 'Singers' },
  { id: 'hero', label: 'Hero', plural: 'Heroes' },
  { id: 'heroine', label: 'Heroine', plural: 'Heroines' },
]

const T: Industry = 'telugu'
const TA: Industry = 'tamil'
const M: Industry = 'malayalam'
const K: Industry = 'kannada'

const people = (role: Role, list: [string, ...Industry[]][]): CinemaPerson[] =>
  list.map(([name, ...industries]) => ({ name, role, industries }))

export const SOUTH_PEOPLE: CinemaPerson[] = [
  ...people('composer', [
    ['Thaman S', T],
    ['Devi Sri Prasad', T, TA],
    ['M. M. Keeravani', T],
    ['A. R. Rahman', TA, T],
    ['Anirudh Ravichander', TA, T],
    ['Ilaiyaraaja', TA, T, M],
    ['Mani Sharma', T],
    ['Mickey J Meyer', T],
    ['Bheems Ceciroleo', T],
    ['Gopi Sundar', M, T],
    ['Hesham Abdul Wahab', M, T],
    ['Anup Rubens', T],
    ['Koti', T],
    ['Ramana Gogula', T],
    ['Harris Jayaraj', TA, T],
    ['Yuvan Shankar Raja', TA],
    ['G. V. Prakash Kumar', TA, T],
    ['Santhosh Narayanan', TA, T],
    ['Sai Abhyankkar', TA],
    ['Vidyasagar', TA, M, T],
    ['Sushin Shyam', M],
    ['Deepak Dev', M],
    ['Ravi Basrur', K, T],
    ['Arjun Janya', K],
    ['Ajaneesh Loknath', K],
    ['V. Harikrishna', K],
    ['Hamsalekha', K],
  ]),
  ...people('singer', [
    ['S. P. Balasubrahmanyam', T, TA, K],
    ['K. S. Chithra', M, T, TA],
    ['Sid Sriram', T, TA],
    ['Shreya Ghoshal', T, TA, M, K],
    ['Anurag Kulkarni', T],
    ['Mangli', T],
    ['Rahul Sipligunj', T],
    ['Ram Miriyala', T],
    ['Sunitha Upadrashta', T],
    ['Geetha Madhuri', T],
    ['Karthik', T, TA],
    ['Haricharan', TA, T],
    ['Armaan Malik', T],
    ['Kaala Bhairava', T],
    ['Chinmayi Sripaada', TA, T],
    ['Mano', TA, T],
    ['S. Janaki', T, TA, K, M],
    ['Hariharan', TA, T],
    ['Shankar Mahadevan', TA, T],
    ['Dhanush', TA],
    ['Jonita Gandhi', TA, T],
    ['K. J. Yesudas', M, TA],
    ['Vineeth Sreenivasan', M],
    ['Shweta Mohan', M, TA],
    ['Vijay Prakash', K, T],
    ['Sanjith Hegde', K, T],
    ['Rajesh Krishnan', K],
  ]),
  ...people('hero', [
    ['Chiranjeevi', T],
    ['Pawan Kalyan', T],
    ['Mahesh Babu', T],
    ['Allu Arjun', T],
    ['Jr NTR', T],
    ['Ram Charan', T],
    ['Prabhas', T],
    ['Nani', T],
    ['Vijay Deverakonda', T],
    ['Ravi Teja', T],
    ['Nandamuri Balakrishna', T],
    ['Nagarjuna', T],
    ['Venkatesh', T],
    ['Ram Pothineni', T],
    ['Naga Chaitanya', T],
    ['Rajinikanth', TA],
    ['Thalapathy Vijay', TA],
    ['Ajith Kumar', TA],
    ['Suriya', TA],
    ['Kamal Haasan', TA],
    ['Dhanush', TA],
    ['Sivakarthikeyan', TA],
    ['Mohanlal', M],
    ['Mammootty', M],
    ['Dulquer Salmaan', M, T],
    ['Fahadh Faasil', M],
    ['Prithviraj Sukumaran', M],
    ['Yash', K],
    ['Puneeth Rajkumar', K],
    ['Kichcha Sudeep', K],
    ['Rishab Shetty', K],
    ['Darshan', K],
  ]),
  ...people('heroine', [
    ['Samantha Ruth Prabhu', T, TA],
    ['Rashmika Mandanna', T, K],
    ['Sreeleela', T],
    ['Pooja Hegde', T],
    ['Sai Pallavi', T, TA, M],
    ['Keerthy Suresh', T, TA],
    ['Anushka Shetty', T],
    ['Tamannaah Bhatia', T, TA],
    ['Kajal Aggarwal', T, TA],
    ['Mrunal Thakur', T],
    ['Krithi Shetty', T],
    ['Meenakshi Chaudhary', T],
    ['Shruti Haasan', T, TA],
    ['Rakul Preet Singh', T],
    ['Nayanthara', TA, T],
    ['Trisha Krishnan', TA, T],
    ['Nithya Menen', M, T, TA],
    ['Malavika Mohanan', M, TA],
    ['Manju Warrier', M],
    ['Mamitha Baiju', M],
    ['Rachita Ram', K],
    ['Rukmini Vasanth', K],
  ]),
]

const LANGUAGE: Record<Industry, string> = {
  telugu: 'Telugu',
  tamil: 'Tamil',
  malayalam: 'Malayalam',
  kannada: 'Kannada',
}

export function industryLabel(industry: Industry) {
  return LANGUAGE[industry]
}

/** The song search that best finds this person's music, in the chosen industry. */
export function songQuery(person: CinemaPerson, industry: Industry | 'all' = 'all') {
  const lang = LANGUAGE[industry === 'all' ? person.industries[0] : industry]
  return person.role === 'hero' || person.role === 'heroine'
    ? `${person.name} ${lang} movie songs`
    : `${person.name} ${lang} hit songs`
}

export function peopleFor(role: Role, industry: Industry | 'all') {
  return SOUTH_PEOPLE.filter((p) => p.role === role && (industry === 'all' || p.industries.includes(industry)))
}

/** Names that start with (or contain a word starting with) the typed text, for search suggestions. */
export function matchPeople(text: string, limit = 6) {
  const q = text.trim().toLowerCase()
  if (q.length < 2) return []
  const seen = new Set<string>()
  return SOUTH_PEOPLE.filter((p) => {
    const name = p.name.toLowerCase()
    const hit = name.startsWith(q) || name.split(/[\s.]+/).some((w) => w.startsWith(q))
    if (!hit || seen.has(p.name)) return false
    seen.add(p.name)
    return true
  }).slice(0, limit)
}

export function initials(name: string) {
  return name
    .replace(/[^A-Za-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}
