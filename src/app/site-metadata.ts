export const productionOrigin = "https://olympiadtrainer.vercel.app";
export const productName = "Олимпиадный тренажёр";
export const productTitle = "Олимпиадная математика, 5 класс";
export const productDescription =
  "Задачи по олимпиадной математике для 5 класса: самостоятельная практика, подсказки, разборы и пробная олимпиада.";

export const productOpenGraph = {
  type: "website" as const,
  locale: "ru_RU",
  siteName: productName,
  title: `${productTitle} | ${productName}`,
  description: productDescription,
};
