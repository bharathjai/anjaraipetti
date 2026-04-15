export const products = [
  {
    id: "biryani-masala",
    name: "Anjaraipetti Biryani Masala",
    price: 599,
    subtitle: "Signature dum biryani spice from Tamil kitchens",
    description:
      "A bold, layered biryani masala crafted for dum cooking, rich gravies, and strong restaurant-style aroma with balanced heat.",
    size: "120 g",
    heatLevel: "Medium Hot",
    origin: "Karaikudi, Tamil Nadu",
    image: "/images/masala-product.svg"
  },
  {
    id: "chilli-masala",
    name: "Anjaraipetti Chilli Masala",
    price: 349,
    subtitle: "Fiery red blend for fry and roast recipes",
    description:
      "A punchy chilli-forward blend for chicken fry, paneer roast, and spicy gravies with deep color and balanced sharpness.",
    size: "100 g",
    heatLevel: "Hot",
    origin: "Virudhunagar, Tamil Nadu",
    image: "/images/masala-product.svg"
  },
  {
    id: "chicken-masala",
    name: "Anjaraipetti Chicken Masala",
    price: 399,
    subtitle: "Restaurant-style aroma for chicken curries",
    description:
      "A rich roasted masala for home-style and hotel-style chicken gravies, delivering savory body and aromatic finish.",
    size: "120 g",
    heatLevel: "Medium",
    origin: "Madurai, Tamil Nadu",
    image: "/images/masala-product.svg"
  },
  {
    id: "mutton-masala",
    name: "Anjaraipetti Mutton Masala",
    price: 449,
    subtitle: "Slow-cooked depth for mutton and kola dishes",
    description:
      "A robust dark-roast spice blend made for mutton gravies, sukka, and kola urundai with strong, layered flavor.",
    size: "120 g",
    heatLevel: "Medium Bold",
    origin: "Chettinad, Tamil Nadu",
    image: "/images/masala-product.svg"
  }
];

export function getProductById(productId) {
  return products.find((item) => item.id === productId) || products[0];
}
