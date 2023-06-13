const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//function to list orders
function list(req, res) {
  res.json({ data: orders });
}

//validation functions for new order input
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}.`,
    });
  };
}

//validate dish is an non-empty array and quantity is positive integer
function dishIsNotEmtpyArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || dishes.length === 0) {
    next({
      status: 400,
      message: `Order must include at least one dish.`,
    });
  }
  return next();
}

function dishHasQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const quantityArray = dishes.map((dish) => dish.quantity);

  for (let index = 0; index < quantityArray.length; index++) {
    let quantity = quantityArray[index];

    if (quantity <= 0 || !Number.isInteger(quantity))
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0.`,
      });
  }

  return next();
}

//validate status is pending, preparing, out-for-delivery, delivered
function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validInput = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validInput.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered.`,
  });
}

//function to post new dish
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

//function to verify existence
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  } else {
    next({ status: 404, message: `Order does not exist:${orderId}.` });
  }
}

//function to update
function update(req, res, next) {
  const order = res.locals.order;
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  const { orderId } = req.params;
  if (id && orderId !== id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  if (status === "delivered") {
    return next({
      status: 404,
      message: `A delivered order cannot be changed.`,
    });
  }
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;
  res.json({ data: order });
}

//function to read order
function read(req, res) {
  res.json({ data: res.locals.order });
  console.log(res.locals.order.status);
}

//function to delete order
function destroy(req, res, next) {
  const { orderId } = req.params;
  const status = orders.find((order) => order.id === orderId).status;
  const index = orders.findIndex((order) => order.id === orderId);
  console.log(orderId, status, index);
  if (status !== "pending")
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`,
    });
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    // bodyDataHas("status"),
    bodyDataHas("dishes"),
    dishIsNotEmtpyArray,
    dishHasQuantity,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    dishIsNotEmtpyArray,
    dishHasQuantity,
    statusIsValid,
    update,
  ],
  delete: [orderExists, destroy],
};
