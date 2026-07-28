import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CustomerRepository } from './customer.repository';
import { CustomerService } from './customer.service';
import { CustomersController } from './customers.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [CustomersController],
  providers: [CustomerRepository, CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
