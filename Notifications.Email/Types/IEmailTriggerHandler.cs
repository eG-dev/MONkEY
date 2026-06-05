using MONkEY.Notifications.Email.Types.Triggers;

namespace MONkEY.Notifications.Email.Types
{
    public interface IEmailTriggerHandler<TEmailTrigger> where TEmailTrigger : EmailTrigger
    {
        Task HandleTrigger(TEmailTrigger trigger, IEmailSenderService emailSender);
    }
}
