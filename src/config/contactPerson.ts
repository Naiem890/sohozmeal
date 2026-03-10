interface Contact {
  name: string;
  phone: string;
}

interface Contacts {
  hallAdmin: Contact[];
  developer: Contact[];
}

const contacts: Contacts = {
  hallAdmin: [],
  developer: [
    { name: 'Solaiman Islam Naiem', phone: '01790732717' },
    { name: 'Shovo', phone: '01860552999' },
  ],
};

export default contacts;
