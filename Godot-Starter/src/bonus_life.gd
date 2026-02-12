extends Area2D
# Bonus life pickup - player gains a life

func _ready():
	body_entered.connect(_on_body_entered)

func _on_body_entered(body):
	if body.is_in_group("player"):
		body.gain_life()
		queue_free()  # Remove the pickup
