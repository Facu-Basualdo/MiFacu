import { Repository } from 'typeorm';
import { AppDataSource } from '../config/DataSource';
import { Link } from '../models/links.model';
import { AppError } from '../middleware/errorHandler.middleware';

export class LinksService {
    private linkRepository: Repository<Link>;

    constructor() {
        this.linkRepository = AppDataSource.getRepository(Link);
    }

    async getAllLinks(userId: string): Promise<Link[]> {
        return await this.linkRepository.find({
            where: { userId },
            order: { id: 'DESC' }
        });
    }

    async getLinkById(id: number, userId: string): Promise<Link> {
        const link = await this.linkRepository.findOne({
            where: { id, userId }
        });

        if (!link) {
            throw new AppError('Link no encontrado', 404);
        }

        return link;
    }

    async createLink(data: Partial<Link>, userId: string): Promise<Link> {
        const link = this.linkRepository.create({
            ...data,
            userId
        });
        return await this.linkRepository.save(link);
    }

    async updateLink(id: number, data: Partial<Link>, userId: string): Promise<Link> {
        const link = await this.getLinkById(id, userId);
        Object.assign(link, data);
        return await this.linkRepository.save(link);
    }

    async deleteLink(id: number, userId: string): Promise<void> {
        const link = await this.getLinkById(id, userId);
        await this.linkRepository.remove(link);
    }
}
