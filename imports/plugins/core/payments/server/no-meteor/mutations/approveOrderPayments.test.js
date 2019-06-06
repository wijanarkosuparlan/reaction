import mockContext from "/imports/test-utils/helpers/mockContext";
import approveOrderPayments from "./approveOrderPayments";

beforeEach(() => {
  jest.resetAllMocks();
});

test("throws if orderId isn't supplied", async () => {
  await expect(approveOrderPayments(mockContext, {
    paymentIds: ["1"],
    shopId: "SHOP_ID"
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if paymentIds isn't supplied", async () => {
  await expect(approveOrderPayments(mockContext, {
    orderId: "abc",
    shopId: "SHOP_ID"
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if shopId isn't supplied", async () => {
  await expect(approveOrderPayments(mockContext, {
    orderId: "abc",
    paymentIds: ["1"]
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if the order doesn't exist", async () => {
  mockContext.collections.Orders.findOne.mockReturnValueOnce(Promise.resolve(null));

  await expect(approveOrderPayments(mockContext, {
    orderId: "abc",
    paymentIds: ["1"],
    shopId: "SHOP_ID"
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if permission check fails", async () => {
  mockContext.collections.Orders.findOne.mockReturnValueOnce(Promise.resolve({
    _id: "abc",
    payments: [
      {
        _id: "1",
        status: "created"
      }
    ],
    shopId: "SHOP_ID"
  }));

  mockContext.userHasPermission.mockReturnValueOnce(false);

  await expect(approveOrderPayments(mockContext, {
    orderId: "abc",
    paymentIds: ["1"],
    shopId: "SHOP_ID"
  })).rejects.toThrowErrorMatchingSnapshot();

  expect(mockContext.userHasPermission).toHaveBeenCalledWith(["orders"], "SHOP_ID");
});

test("throws if the order payment doesn't exist", async () => {
  mockContext.collections.Orders.findOne.mockReturnValueOnce(Promise.resolve({
    payments: [
      {
        _id: "2"
      }
    ],
    shopId: "SHOP_ID"
  }));

  mockContext.userHasPermission.mockReturnValueOnce(true);

  await expect(approveOrderPayments(mockContext, {
    orderId: "abc",
    paymentIds: ["1"],
    shopId: "SHOP_ID"
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("updates an order status", async () => {
  mockContext.userHasPermission.mockReturnValueOnce(true);

  mockContext.collections.Orders.findOne.mockReturnValueOnce(Promise.resolve({
    _id: "abc",
    payments: [
      {
        _id: "1",
        status: "created"
      }
    ],
    shopId: "SHOP_ID"
  }));

  await approveOrderPayments(mockContext, {
    orderId: "abc",
    paymentIds: ["1"],
    shopId: "SHOP_ID"
  });

  mockContext.collections.Orders.findOneAndUpdate.mockReturnValueOnce(Promise.resolve({
    modifiedCount: 1,
    value: {}
  }));

  await expect(mockContext.collections.Orders.findOneAndUpdate).toHaveBeenCalledWith(
    { _id: "abc" },
    {
      $set: {
        payments: [
          {
            _id: "1",
            status: "approved"
          }
        ]
      }
    },
    { returnOriginal: false }
  );
});