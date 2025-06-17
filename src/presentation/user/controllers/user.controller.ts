import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserDto } from '../dto/user.dto';
import { UserFacadeService } from '../../../application/user/services/UserFacadeService';
import { CreateUserCommand } from '../../../application/user/commands';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateUserHandler } from '../../../application/user/handlers/command';
import { UserDtoMapper } from '../dto/user.dto.mapper';

@Controller('users')
export class UserController {
  constructor(
    private readonly userFacade: UserFacadeService,
    private readonly createUserHandler: CreateUserHandler,
    private readonly userDtoMapper: UserDtoMapper,
  ) {}

  /* @Post()
  async saveUser(@Body() userDto: UserDto) {
    return await this.userFacade.save(userDto);
  }*/

  // Pour la creation de l'utilisateur'
  @Post('create')
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<Partial<UserDto>> {
    const createUserCommand = new CreateUserCommand(
      this.userDtoMapper.toDomain(createUserDto),
    );

    const user = await this.createUserHandler.handle(createUserCommand);
    return this.userDtoMapper.toDto(user);
  }

  @Post('bulk')
  async saveUsers(@Body() createUserDtos: CreateUserDto[]) {
    return await this.userFacade.saveAll(
      createUserDtos.map((createUserDto) =>
        this.userDtoMapper.toDomain(createUserDto),
      ),
    );
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return await this.userFacade.getOneUserWithRelations(id);
  }

  @Get()
  async getAllUsers() {
    return await this.userFacade.findAll();
  }

  @Get('filter/no-info')
  async getUsersWithNoInfo() {
    return await this.userFacade.findAllWithNoInfo();
  }

  @Get('filter/no-followers')
  async getUsersWithNoFollowers() {
    return await this.userFacade.findAllWithNoFollowers();
  }

  @Get('filter/no-followings')
  async getUsersWithNoFollowings() {
    return await this.userFacade.findAllWithNoFollowings();
  }
}
