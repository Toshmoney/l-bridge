const fillTemplate = (template, fields) => {
  let filled = template;
  Object.keys(fields).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    filled = filled.replace(regex, fields[key]);
  });
  return filled;
};

module.exports = { fillTemplate };
