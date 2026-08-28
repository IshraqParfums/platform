-- Guest-complete mints a brew with no owner; claim / cart merge attach later.
ALTER TABLE "bespoke_perfumes" ALTER COLUMN "customerId" DROP NOT NULL;
