import { Module, forwardRef } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { AdminCustomersController } from './admin-customers.controller';
import { CustomerRepository } from './customer.repository';
import { CustomerService } from './customer.service';
import { CustomersController } from './customers.controller';

@Module({
  imports: [forwardRef(() => AuthModule), AdminModule],
  controllers: [CustomersController, AdminCustomersController],
  providers: [CustomerRepository, CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
