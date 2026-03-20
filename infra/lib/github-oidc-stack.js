"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubOidcStack = void 0;
const cdk = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
class GithubOidcStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const provider = new iam.OpenIdConnectProvider(this, 'GithubOidc', {
            url: 'https://token.actions.githubusercontent.com',
            clientIds: ['sts.amazonaws.com'],
        });
        new iam.Role(this, 'GithubActionsRole', {
            roleName: 'github-actions-role',
            assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
                StringLike: {
                    'token.actions.githubusercontent.com:sub': 'repo:progate-hackathon-an/Kaleido-Scan:ref:refs/heads/main',
                },
            }),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
            ],
        });
    }
}
exports.GithubOidcStack = GithubOidcStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aHViLW9pZGMtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnaXRodWItb2lkYy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsMkNBQTJDO0FBRzNDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDakUsR0FBRyxFQUFFLDZDQUE2QztZQUNsRCxTQUFTLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztTQUNqQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3RDLFFBQVEsRUFBRSxxQkFBcUI7WUFDL0IsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRTtnQkFDekUsVUFBVSxFQUFFO29CQUNWLHlDQUF5QyxFQUN2Qyw0REFBNEQ7aUJBQy9EO2FBQ0YsQ0FBQztZQUNGLGVBQWUsRUFBRTtnQkFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLHFCQUFxQixDQUFDO2FBQ2xFO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdEJELDBDQXNCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGNsYXNzIEdpdGh1Yk9pZGNTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHByb3ZpZGVyID0gbmV3IGlhbS5PcGVuSWRDb25uZWN0UHJvdmlkZXIodGhpcywgJ0dpdGh1Yk9pZGMnLCB7XG4gICAgICB1cmw6ICdodHRwczovL3Rva2VuLmFjdGlvbnMuZ2l0aHVidXNlcmNvbnRlbnQuY29tJyxcbiAgICAgIGNsaWVudElkczogWydzdHMuYW1hem9uYXdzLmNvbSddLFxuICAgIH0pO1xuXG4gICAgbmV3IGlhbS5Sb2xlKHRoaXMsICdHaXRodWJBY3Rpb25zUm9sZScsIHtcbiAgICAgIHJvbGVOYW1lOiAnZ2l0aHViLWFjdGlvbnMtcm9sZScsXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uV2ViSWRlbnRpdHlQcmluY2lwYWwocHJvdmlkZXIub3BlbklkQ29ubmVjdFByb3ZpZGVyQXJuLCB7XG4gICAgICAgIFN0cmluZ0xpa2U6IHtcbiAgICAgICAgICAndG9rZW4uYWN0aW9ucy5naXRodWJ1c2VyY29udGVudC5jb206c3ViJzpcbiAgICAgICAgICAgICdyZXBvOnByb2dhdGUtaGFja2F0aG9uLWFuL0thbGVpZG8tU2NhbjpyZWY6cmVmcy9oZWFkcy9tYWluJyxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQWRtaW5pc3RyYXRvckFjY2VzcycpLFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxufVxuIl19