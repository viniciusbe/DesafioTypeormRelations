/* eslint-disable prettier/prettier */
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
  ) { }

  public async execute({ name, email }: IRequest): Promise<Customer> {
    let user = await this.customersRepository.findByEmail(email);

    if (user) {
      throw new AppError('This e-mail is already being used');
    }

    user = await this.customersRepository.create({ name, email });

    return user;
  }
}

export default CreateCustomerService;
