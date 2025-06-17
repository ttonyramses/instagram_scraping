import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserDto } from '../dto/user.dto';
import { UserFacadeService } from '../../../application/user/services/UserFacadeService';
import { CreateUserCommand } from '../../../application/user/commands';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateUserHandler } from '../../../application/user/handlers/command';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('users')
export class UserController {
  constructor(
    private readonly userFacade: UserFacadeService,
    private readonly createUserHandler: CreateUserHandler,
  ) {}

  /* @Post()
  async saveUser(@Body() userDto: UserDto) {
    return await this.userFacade.save(userDto);
  }*/

  // Pour la creation de l'utilisateur'
  @Post('create')
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    const createUserCommand = new CreateUserCommand(
      createUserDto.id,
      createUserDto.name,
      createUserDto.biography,
    );

    const user = await this.createUserHandler.handle(createUserCommand);
    return this.mapToDto(user);
  }

  @Post('bulk')
  async saveUsers(@Body() userDtos: UserDto[]) {
    return await this.userFacade.saveAll(userDtos);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return await this.userFacade.findOneUser(id);
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

  private mapToDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      biography: user.biography,
      json: user.json,
      nbFollowers: user.nbFollowers,
      nbFollowings: user.nbFollowings,
      nbPublications: user.nbPublications,
      instagramId: user.instagramId,
      facebookId: user.facebookId,
      category: user.category,
      externalUrl: user.externalUrl,
      profileUrl: user.profileUrl,
      hasInfo: user.hasInfo,
      hasFollowerProcess: user.hasFollowerProcess,
      hasFollowingProcess: user.hasFollowingProcess,
      enable: user.enable,
      maxIdFollower: user.maxIdFollower,
      maxIdFollowing: user.maxIdFollowing,
    };
  }
}
