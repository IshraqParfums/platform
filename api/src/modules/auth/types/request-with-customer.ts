export type CustomerJwtPayload = {
  sub: string;
  role: 'customer';
  phone: string;
};

export type RequestWithCustomer = {
  user: {
    customerId: string;
    phone: string;
    role: 'customer';
  };
};
