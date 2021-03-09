import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const customerExists = this.customersRepository.findByEmail(email);
    if (customerExists) {
      throw new AppError('E-mail already registered');
    }
    const customer = this.customersRepository.create({
      name,
      email,
    });
    return customer;
  }
}

export default CreateCustomerService;
