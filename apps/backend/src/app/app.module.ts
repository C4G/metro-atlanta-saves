import { AlliesOnProgramsModule } from '@mas/backend-allies-on-programs';
import { AuthModule } from '@mas/backend-auth';
import { BlogsModule } from '@mas/backend-blogs';
import { CheckpointNamesModule } from '@mas/backend-checkpoint-names';
import { CheckpointsModule } from '@mas/backend-checkpoints';
import { CohortsModule } from '@mas/backend-cohorts';
import { DescriptionModule } from '@mas/backend-description';
import { DiscussionModule } from '@mas/backend-discussion';
import { EducationalCategoryModule } from '@mas/backend-educational-category';
import { EducationalContentModule } from '@mas/backend-educational-content';
import { ImagesModule } from '@mas/backend-images';
import { IntroductionModule } from '@mas/backend-introduction';
import { LearningsModule } from '@mas/backend-learnings';
import { MailModule, MailService } from '@mas/backend-mail';
import { PartnersModule } from '@mas/backend-partners';
import { PrismaModule } from '@mas/backend-prisma';
import { ProgramsModule } from '@mas/backend-programs';
import { RequirementsModule } from '@mas/backend-requirements';
import { JwtStrategy } from '@mas/backend-shared';
import { StoriesModule } from '@mas/backend-stories';
import { PeerEvaluationGuideModule } from '@mas/backend-peer-evaluation-guide';
import { UserGuideModule } from '@mas/backend-user-guide';
import { UsersModule } from '@mas/backend-users';
import { UsersOnProgramsModule } from '@mas/backend-users-on-programs';
import { WhatWeAreModule } from '@mas/backend-what-we-are';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HealthController } from './health.controller';
import { createBetterAuth } from '@mas/backend-auth';
import { PrismaService } from '@mas/backend-prisma';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BetterAuthModule.forRootAsync({
      isGlobal: true,
      imports: [PrismaModule, MailModule],
      inject: [ConfigService, PrismaService, MailService],
      useFactory: (config: ConfigService, prisma: PrismaService, mailService: MailService) => ({
        auth: createBetterAuth(prisma, config, mailService),
        // Keep legacy JWT services available only for temporary rollback endpoints;
        // protected application routes use ManagedSessionGuard.
        disableGlobalAuthGuard: true,
      }),
    }),
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: '1y' },
    }),
    AlliesOnProgramsModule,
    AuthModule,
    PrismaModule,
    UsersModule,
    EducationalCategoryModule,
    EducationalContentModule,
    MailModule,
    PartnersModule,
    ProgramsModule,
    RequirementsModule,
    UsersOnProgramsModule,
    CheckpointsModule,
    BlogsModule,
    CohortsModule,
    StoriesModule,
    LearningsModule,
    DescriptionModule,
    DiscussionModule,
    IntroductionModule,
    UserGuideModule,
    PeerEvaluationGuideModule,
    ImagesModule,
    CheckpointNamesModule,
    WhatWeAreModule,
  ],
  controllers: [HealthController],
  providers: [JwtStrategy],
})
export class AppModule {}
