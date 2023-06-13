const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//function to list dishes
function list(req, res) {
  res.json({ data: dishes });
}

//validation functions for new dish input
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    // const propertyValue = String(data[propertyName]).split(" ").join("");
    // if (propertyValue && data[propertyName]) {
    //   return next();
    // }
    next({
      status: 400,
      message: `Dish must include a ${propertyName}.`,
    });
  };
}

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price))
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0.`,
    });
  next();
}

//function to post new dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

//function to verify existence

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  } else {
    next({ status: 404, message: `Dish does not exist: ${dishId}.` });
  }
}

//function to update
function update(req, res, next) {
  const dish = res.locals.dish;
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const { dishId } = req.params;
  if (id && dishId !== id)
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}.`,
    });
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish });
}

//function to read dish
function read(req, res) {
  res.json({ data: res.locals.dish });
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    update,
  ],
};

// const propertyValue = String(data[propertyName]).split(" ").join("");
// if (propertyValue && data[propertyName]) {
//   return next();
// }
