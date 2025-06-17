import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UserDto } from '../dto/user.dto';
import { UserFacadeService } from '../../../application/user/services/UserFacadeService';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserDtoMapper } from '../dto/user.dto.mapper';

@Controller('users')
export class UserController {
  constructor(
    private readonly userFacade: UserFacadeService,
    private readonly userDtoMapper: UserDtoMapper,
  ) {}

  // Pour la creation de l'utilisateur'
  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<Partial<UserDto>> {
    const createUser = this.userDtoMapper.createDtoToDomain(createUserDto);
    const user = await this.userFacade.createUser(createUser);
    return this.userDtoMapper.entityToUserDto(user);
  }

  @Post('bulk')
  async saveUsers(@Body() createUserDtos: CreateUserDto[]) {
    return await this.userFacade.saveAll(
      createUserDtos.map((createUserDto) =>
        this.userDtoMapper.createDtoToDomain(createUserDto),
      ),
    );
  }

  @Put() // Ajoutez l'ID dans l'URL
  async updateUser(
    @Body() updateUserDto: CreateUserDto,
  ): Promise<Partial<UserDto>> {
    // Ajoutez l'ID au DTO
    const updateUser = this.userDtoMapper.updateDtoToDomain(updateUserDto);

    console.log('Data to update:', updateUser); // Debug

    const user = await this.userFacade.updateUser(updateUser);
    return this.userDtoMapper.entityToUserDto(user);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userFacade.getOneUserWithRelations(id, [
      'followers',
      'followings',
      'hobbies',
    ]);
    return this.userDtoMapper.entityToUserDto(user);
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
