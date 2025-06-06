import {inject, injectable} from 'inversify';
import {IHobbyScrapingService} from '../interface/ihobby-scraping.service';
import {TYPES} from '../../core/type.core';
import {Logger} from 'winston';
import {IBrowserService} from '../interface/ibrowser.service';
import {IUserService} from '../../domaine/user/interface/iuser.service';
import {UserDto} from '../../domaine/user/dto/user.dto';
import {IHobbyService} from "../../domaine/hobby/interface/ihobby.service";
import { HobbyDto } from '../../domaine/hobby/dto/hobby.dto';


@injectable()
export class HobbyScrapingService implements IHobbyScrapingService {
    private nbItemProcess: number;

    constructor(
        @inject(TYPES.IBrowserService) private readonly browserService: IBrowserService,
        @inject(TYPES.IUserService) private readonly userService: IUserService,
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.IHobbyService) private readonly hobbyService: IHobbyService,
    ) {
    }

    async applyHobbies(
        hobbies: string[],
        pseudoList?: string[],
    ): Promise<void> {
        const hobbies_list = [];
        for (const hobby of hobbies) {
            let hob = await this.hobbyService.findByName(
                hobby.trim().toUpperCase(),
            );
            if (!hob) {
                const hobDto = new HobbyDto();
                hobDto.name = hobby.trim().toUpperCase();
                hob = await this.hobbyService.save(hobDto);
            }
            hobbies_list.push({ id: hob.id } as HobbyDto);
        }

        for (const pseudo of pseudoList) {
            let user = await this.userService.findOneUser(pseudo);
            if (!user) {
                await this.userService.save({ id: pseudo } as UserDto);
            }
            await this.userService.addHobbies(pseudo, hobbies_list);
            this.logger.info('hobbies added to ' + pseudo);
        }

    }


    async getHobbiesByApi(
        instagramId: number,
        pseudo: string,
    ): Promise<string[]> {
        const variables = `{"id":"${instagramId}","first":50}`;
        const __spin_t = Math.floor(Date.now() / 1000);
        const bodyRequest = this.browserService.getBodyRequest();
        bodyRequest.set('variables', variables);
        bodyRequest.set('__spin_t', __spin_t.toString());

        const response = await fetch(this.browserService.getUrlRequest(), {
            method: 'POST',
            headers: this.browserService.getHeadersRequest(),
            body: bodyRequest,
        });

        if (!response.ok) {
            this.logger.error(`pseudo ${pseudo} : erreur http ${response.status}`);

            if (response.status === 404) {
                this.logger.debug(`${pseudo} : ce pseudo est certainement desactivé`);
                return [];
            } else {
                throw new Error(
                    `pseudo ${pseudo} : Veuillez rapidement reactiver votre compte`,
                );
            }
        } else {
            this.logger.debug(`pseudo ${pseudo} : status http ${response.status} OK`);
        }

        const hobbiesResponse = await response.json();
        const hobbies: string[] = [];

        if (
            hobbiesResponse &&
            hobbiesResponse.data &&
            hobbiesResponse.data.user &&
            hobbiesResponse.data.user.edge_followed_by &&
            hobbiesResponse.data.user.edge_followed_by.edges
        ) {
            for (const edge of hobbiesResponse.data.user.edge_followed_by.edges) {
                if (edge.node && edge.node.username) {
                    hobbies.push(edge.node.username);
                }
            }
        }

        return hobbies;
    }

    async getHobbiesOnPage(pseudo: string): Promise<string[]> {
        const url = this.browserService.getBaseUrl() + '/' + pseudo;
        const myPage = await this.browserService.getContext().newPage();
        const hobbies: string[] = [];

        let endProcess = false;

        new Promise((resolve, reject) => {
            let hasGetHobbies = false;
            myPage.on('response', async (response) => {
                const request = response.request();
                const regexGraphQl = /\/api\/graphql|\/graphql\/query/;
                const matchGraphQl = regexGraphQl.exec(request.url());

                const regexBulkRoute = /ajax\/bulk-route-definitions/;
                const matchBulkRoute = regexBulkRoute.exec(request.url());

                const regexLoginPage =
                    /\/api\/v1\/web\/login_page|\/accounts\/suspended/;
                const matchLoginPage = regexLoginPage.exec(request.url());

                let isBlacklisted = false;

                if (request.resourceType() === 'xhr' && matchLoginPage) {
                    this.logger.info('Vous êtes déjà blacklistés par instagram');
                    endProcess = true;
                    throw new Error('Veuillez changer de poste ou de IP');
                } else if (
                    request.resourceType() === 'xhr' &&
                    matchGraphQl &&
                    !hasGetHobbies
                ) {
                    const postData = request.postData();
                    const payload = new URLSearchParams(postData);
                    try {
                        const variables = payload.get('variables');

                        if (variables) {
                            const variablesObj = JSON.parse(variables);
                            if (variablesObj.first === 50) {
                                if (response.status() === 200) {
                                    const textBody = await response.text();
                                    const body = JSON.parse(textBody);
                                    if (body.data.user.edge_followed_by.edges) {
                                        endProcess = false;
                                        hasGetHobbies = true;
                                        resolve(body);
                                    }
                                } else {
                                    isBlacklisted = true;
                                }
                            }
                        }
                    } catch (error) {
                        this.logger.error(
                            `erreur get response for url ${request.url()} error: ${error.message}`,
                        );
                    }

                    if (isBlacklisted) {
                        endProcess = true;
                        this.logger.info('Vous êtes déjà blacklistés par instagram');
                        throw new Error('Veuillez changer de poste ou de IP');
                    }
                } else if (request.resourceType() === 'xhr' && matchBulkRoute) {
                    await this.sleep(2_000);
                    if (!hasGetHobbies) {
                        this.logger.debug(
                            `${pseudo} : ce pseudo est certainement desactivé`,
                        );
                        endProcess = true;
                    }
                }
            });
        }).then((response: any) => {
            if (
                response &&
                response.data &&
                response.data.user &&
                response.data.user.edge_followed_by &&
                response.data.user.edge_followed_by.edges
            ) {
                for (const edge of response.data.user.edge_followed_by.edges) {
                    if (edge.node && edge.node.username) {
                        hobbies.push(edge.node.username);
                    }
                }
            }
            endProcess = true;
        });

        try {
            await myPage.goto(url);
        } catch (error) {
            this.logger.error(`erreur go to page ${url} ${error.message}`);
            return hobbies;
        }

        return new Promise((resolve, reject) => {
            const intervalID = setInterval(async () => {
                if (endProcess) {
                    await myPage.close();
                    clearInterval(intervalID);
                    clearTimeout(timeoutID);
                    resolve(hobbies);
                }
            }, 500);

            const timeoutID = setTimeout(async () => {
                clearInterval(intervalID);
                await myPage.close();
                resolve(hobbies);
            }, 10_000);
        });
    }

    private sleep(timeMilliSeconde: number): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, timeMilliSeconde);
        });
    }

    private getRandomNumber(min: number = 0, max: number = 100): number {
        if (min >= max) {
            throw new Error(
                "Le paramètre 'min' doit être strictement inférieur à 'max'.",
            );
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
} 