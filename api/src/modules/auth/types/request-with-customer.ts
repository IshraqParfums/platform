export type CustomerJwtPayload = {
  sub: string;
  role: 'customer';
  phone: string;
};

export type CustomerAuthUser = {
  customerId: string;
  phone: string;
  role: 'customer';
};

export type RequestWithCustomer = {
  user: CustomerAuthUser;
};

/** Used with {@link OptionalCustomerJwtGuard} — `user` is set only when JWT is valid. */
export type RequestWithOptionalCustomer = {
  user?: CustomerAuthUser;
};
