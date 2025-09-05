const templates = {
  tenancy: {
    title: "Tenancy Agreement",
    content: `
      This Tenancy Agreement is made between {{landlord}} ("Landlord") 
      and {{tenant}} ("Tenant") for the property located at {{address}}.
      
      The tenancy shall last for a period of {{duration}} months 
      commencing on {{startDate}}. The agreed rent is ₦{{rent}} 
      payable monthly in advance.
      
      Signed,
      Landlord: __________________
      Tenant: ____________________
    `,
    fields: ["landlord", "tenant", "address", "duration", "startDate", "rent"],
  },

  employment: {
    title: "Employment Contract",
    content: `
      This Employment Contract is entered into between {{employer}} ("Employer") 
      and {{employee}} ("Employee").
      
      The Employee agrees to work as a {{position}} starting on {{startDate}}, 
      with a monthly salary of ₦{{salary}}.
      
      Signed,
      Employer: __________________
      Employee: __________________
    `,
    fields: ["employer", "employee", "position", "startDate", "salary"],
  },

  nda: {
    title: "Non-Disclosure Agreement",
    content: `
      This NDA is made between {{partyA}} and {{partyB}} on {{date}}.
      
      Both parties agree not to disclose confidential information 
      shared during the course of business discussions.
      
      Signed,
      Party A: __________________
      Party B: __________________
    `,
    fields: ["partyA", "partyB", "date"],
  },
};

module.exports = templates;